import {processor} from './processor'
import {db, Store} from './db'
import {Block, MintPosition, Pool, Swap, Transaction, BurnLiquidity} from './model'
import {populatePoolsTable } from './pools'
import { isLiquidityBurn, isPoolPositionMint, isSwap, parseLiquidityBurn, parseSwap } from './mapping/poolContract'
import { isIncreaseLiquidity } from './mapping/positionManagerContract'
import { Log } from '@subsquid/evm-processor'
import { parseMint } from './mapping/positionMint'


type ExecutionContext = {
    blocks: Block[]
    transactions: Transaction[]
    swaps: Swap[]
    mints: MintPosition[]
    liquidityBurn: BurnLiquidity[]
    poolMintEventMap: Record<string, Log>
    increaseLiquidityEventMap: Record<string, Log>
}

const newExecutionContext = (): ExecutionContext => {
    return {
        blocks: [],
        transactions: [],
        swaps: [],
        mints: [],
        liquidityBurn: [],
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

    let {blocks, transactions, swaps, mints, liquidityBurn, poolMintEventMap, increaseLiquidityEventMap} = newExecutionContext();

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
                const burn = await parseLiquidityBurn(ctx, log, transactions.find(t => t.hash === log.transactionHash)!)
                if(burn) liquidityBurn.push(burn);
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

    // TODO: lets process increase liquidity events that are not related to a mint

    // save, order is important!
    await ctx.store.insert(blocks)
    await ctx.store.insert(transactions)
    await ctx.store.insert(swaps)
    await ctx.store.insert(mints)
    await ctx.store.insert(liquidityBurn)
})
