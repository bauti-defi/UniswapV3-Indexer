import {processor, Log} from './processor'
import {db} from './db'
import {Block, DecreasePositionLiquidity, MintPosition, Swap, Transaction} from './model'
import {populatePoolsTable } from './pools'
import { isLiquidityBurn, isPoolPositionMint, isSwap, parseLiquidityBurn, parseSwap } from './mapping/poolContract'
import { isDecreasePositionLiquidity, isIncreaseLiquidity } from './mapping/positionManagerContract'
import { parseMint } from './mapping/position'
import Matcher from './matcher'

type ExecutionContext = {
    blocks: Block[]
    transactions: Transaction[]
    swaps: Swap[]
    mints: MintPosition[]
    burns: DecreasePositionLiquidity[]

    burnEvents: Matcher<Log, Log>
    poolMintEventMap: Record<string, Log>
    increaseLiquidityEventMap: Record<string, Log>
}

const newExecutionContext = (): ExecutionContext => {
    return {
        blocks: [],
        transactions: [],
        swaps: [],
        mints: [],
        burns: [],
        burnEvents: new Matcher(),
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

    let {blocks, transactions, swaps, mints, burnEvents, poolMintEventMap, increaseLiquidityEventMap, burns} = newExecutionContext();

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
                poolMintEventMap[log.transactionHash] = log; // store for processing later
            } else if(isIncreaseLiquidity(log)){
                increaseLiquidityEventMap[log.transactionHash] = log; // store for processing later
            }else if(isLiquidityBurn(log)){
                burnEvents.addLeft(log.transactionHash, log); // store for processing later
            }else if(isDecreasePositionLiquidity(log)){
                burnEvents.addRight(log.transactionHash, log); // store for processing later
            }
        }
    }


    // lets process the position mint events
    // position mints emit a pool mint event and an increase liquidity event, we need both
    const unConsumedIncreaseLiquidityEvents: string[] = [] 
    for(let increaseEvent of Object.values(increaseLiquidityEventMap)) {
        const poolMintEvent = poolMintEventMap[increaseEvent.transaction?.hash!];
        if(poolMintEvent) {
            const mint = await parseMint(ctx, poolMintEvent, increaseEvent, transactions.find(t => t.hash === poolMintEvent.transaction?.hash)!)
            if(mint) mints.push(mint);
        } else {
            unConsumedIncreaseLiquidityEvents.push(increaseEvent.transaction?.hash!);
        }
    }

    // lets process the liquidity burn events
    for(let [txHash, burn, decrease] of burnEvents.getMatchedEntries()) {
        if(burn && decrease) {
            const decreaseLiquidity = await parseLiquidityBurn(ctx, burn, decrease, transactions.find(t => t.hash === txHash)!)
            if(decreaseLiquidity) burns.push(decreaseLiquidity)
        } else {
            ctx.log.error(`Unable to find burn and decrease events for transaction ${txHash}`);
        }
    }

    // TODO: lets process increase liquidity events that are not related to a mint

    // save, order is important!
    await ctx.store.insert(blocks)
    await ctx.store.insert(transactions)
    await ctx.store.insert(swaps)
    await ctx.store.insert(mints)
    await ctx.store.insert(burns)
})
