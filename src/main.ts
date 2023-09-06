import {processor} from './processor'
import {db, Store} from './db'
import {EntityBuffer} from './entityBuffer'
import {Block, Pool, Swap, Transaction} from './model'
import {populatePoolsTable } from './pools'
import { isSwap, parseSwap } from './mapping/poolContract'
import { isPoolCreation, parsePoolCreation } from './mapping/poolFactoryContract'

let poolsCreated = false

processor.run(db, async (ctx) => {
    if(!poolsCreated) {
        await populatePoolsTable(ctx);
        poolsCreated = true;

        ctx.log.debug(`Pools table populated with pools of interest`);
    }

    let blocks: Block[] = []
    let transactions: Transaction[] = []
    let swaps: Swap[] = []

    for (let block of ctx.blocks) {
        const newBlock = new Block({
            id: block.header.id,
            chainId: 42161, //arbitrum
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp),
        })

        blocks.push(newBlock);

        for(let transaction of block.transactions) {
            const newTransaction = new Transaction({
                id: transaction.id,
                block: newBlock,
                hash: transaction!.hash,
                to: transaction!.to,
                from: transaction!.from,
                status: transaction!.status,
                gasUsed: transaction!.gasUsed
            })

            transactions.push(newTransaction);
        }
        
        for (let log of block.logs) {

            // if(isPoolCreation(log)) {
            //     const pool = parsePoolCreation(ctx, log)
            //     if(pool && isPoolAddress(pool.poolAddress)) await ctx.store.insert(pool); // lets store right away
            // }

            if (isSwap(log)) {
                const swap = await parseSwap(ctx, log, transactions.find(t => t.hash === log.transactionHash)!)
                swaps.push(swap!);
            }
        }
    }

    // save, order is important!
    await ctx.store.insert(blocks)
    await ctx.store.insert(transactions)
    await ctx.store.insert(swaps)

    // clear
    blocks = []
    transactions = []
    swaps = []
})
