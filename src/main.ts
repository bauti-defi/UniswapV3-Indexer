import {processor, Log} from './processor'
import {db} from './db'
import {Block, DecreasePositionLiquidity, MintPosition, Swap, Transaction} from './model'
import {populatePoolsTable } from './pools'
import { isLiquidityBurn, isPoolPositionMint, isSwap, parseSwap } from './mapping/poolContract'
import { isDecreasePositionLiquidity, isIncreaseLiquidity } from './mapping/positionManagerContract'
import { parseMint, parseLiquidityBurn } from './mapping/position'
import Matcher from './matcher'

type ExecutionContext = {
    blocks: Block[]
    transactions: Transaction[]
    swaps: Swap[]
    mints: MintPosition[]
    liquidityDecreases: DecreasePositionLiquidity[]

    liquidityDecreaseEvents: Matcher<Log, Log>
    mintEvents: Matcher<Log, Log>
    poolMintEventMap: Record<string, Log>
    increaseLiquidityEventMap: Record<string, Log>
}

const newExecutionContext = (): ExecutionContext => {
    return {
        blocks: [],
        transactions: [],
        swaps: [],
        mints: [],
        liquidityDecreases: [],
        liquidityDecreaseEvents: new Matcher(),
        mintEvents: new Matcher(),
        poolMintEventMap: {},
        increaseLiquidityEventMap: {}
    }
}


let poolsCreated = false

processor.run(db, async (ctx) => {
    if(!poolsCreated) {
        await populatePoolsTable(ctx);
        poolsCreated = true;

        ctx.log.debug(`Pools table populated with pools of interest`);
    }

    let {blocks, transactions, swaps, mints, liquidityDecreaseEvents, poolMintEventMap, increaseLiquidityEventMap, liquidityDecreases, mintEvents} = newExecutionContext();

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
            } else if(isPoolPositionMint(log)){
                // poolMintEventMap[log.transactionHash] = log; // store for processing later
                mintEvents.addLeft(log.transactionHash, log); // store for processing later
            } else if(isIncreaseLiquidity(log)){
                // increaseLiquidityEventMap[log.transactionHash] = log; // store for processing later
                mintEvents.addRight(log.transactionHash, log); // store for processing later
            }else if(isLiquidityBurn(log)){
                liquidityDecreaseEvents.addLeft(log.transactionHash, log); // store for processing later
            }else if(isDecreasePositionLiquidity(log)){
                liquidityDecreaseEvents.addRight(log.transactionHash, log); // store for processing later
            }
        }
    }

    // lets process the position mint events
    for(let [txHash, poolMint, increase] of mintEvents.getMatchedEntries()) {
        const mint = await parseMint(ctx, poolMint, increase, transactions.find(t => t.hash === txHash)!)
        if(mint) mints.push(mint);
    }

    // lets process the liquidity burn events
    for(let [txHash, burn, decrease] of liquidityDecreaseEvents.getMatchedEntries()) {
        const decreaseLiquidity = await parseLiquidityBurn(ctx, burn, decrease, transactions.find(t => t.hash === txHash)!)
        if(decreaseLiquidity) liquidityDecreases.push(decreaseLiquidity)
    }

    // TODO: lets process increase liquidity events that are not related to a mint

    // save, order is important!
    await ctx.store.insert(blocks)
    await ctx.store.insert(transactions)
    await ctx.store.insert(swaps)
    await ctx.store.insert(mints)
    await ctx.store.insert(liquidityDecreases)
})
