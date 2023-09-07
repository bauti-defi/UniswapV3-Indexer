import {processor, Log, BlockTransaction} from './processor'
import {db} from './db'
import {Block, BurnPosition, CollectionPosition, DecreasePositionLiquidity, MintPosition, Position, Swap, Transaction} from './model'
import {populatePoolsTable } from './utils/pools'
import { isLiquidityBurn, isPoolCollection, isPoolPositionMint, isSwap, parseSwap } from './mapping/poolContract'
import { isBurn, isCollectPosition, isDecreasePositionLiquidity, isIncreaseLiquidity } from './mapping/positionManagerContract'
import { parseMint, parseLiquidityBurn } from './mapping/position'
import Matcher from './utils/matcher'
import { parseCollect } from './mapping/position'
import { parseBurn } from './mapping/position'
import { chainId } from './utils/chain'

type ExecutionContext = {
    readonly blocks: Block[]
    readonly transactions: [Transaction, BlockTransaction][]
    readonly swaps: Swap[]
    readonly mints: MintPosition[]
    readonly liquidityDecreases: DecreasePositionLiquidity[]
    readonly collects: CollectionPosition[]
    readonly burns: BurnPosition[]
    readonly positions: Position[]

    readonly transactionMap: Record<string, Transaction>
    readonly collectionEvents: Matcher<Log, Log>
    readonly liquidityDecreaseEvents: Matcher<Log, Log>
    readonly mintEvents: Matcher<Log, Log>
    readonly poolMintEventMap: Record<string, Log>
    readonly increaseLiquidityEventMap: Record<string, Log>
}

const newExecutionContext = ():  Readonly<ExecutionContext> => {
    return {
        blocks: [],
        transactions: [],
        swaps: [],
        mints: [],
        liquidityDecreases: [],
        collects: [],
        burns: [],
        positions: [],

        transactionMap: {},
        liquidityDecreaseEvents: new Matcher(),
        collectionEvents: new Matcher(),
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

        ctx.log.info(`Pools table populated with pools of interest`);
    }

    let {blocks, transactionMap, transactions, swaps, mints, liquidityDecreaseEvents, liquidityDecreases, mintEvents, collectionEvents, collects, burns, positions} = newExecutionContext();

    for (let block of ctx.blocks) {
        const newBlock = new Block({
            id: block.header.id,
            chainId: chainId(), 
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp),
        })

        blocks.push(newBlock);

        for(let rawTrx of block.transactions) {
            const transaction = new Transaction({
                id: rawTrx.id,
                block: newBlock,
                transactionIndex: rawTrx.transactionIndex,
                hash: rawTrx!.hash,
                to: rawTrx!.to,
                from: rawTrx!.from,
                status: rawTrx!.status,
                gasUsed: rawTrx!.gasUsed
            })

            transactions.push([transaction, rawTrx]);
            transactionMap[transaction.hash] = transaction;
        }
        
        for (let log of block.logs) {

            // if(isPoolCreation(log)) {
            //     const pool = parsePoolCreation(ctx, log)
            //     if(pool) await ctx.store.insert(pool); // lets store right away for future use
            // }

             if (isSwap(log)) {
                const swap = await parseSwap(ctx, log, transactionMap[log.transactionHash]!)
                swaps.push(swap!);
            } else if(isPoolPositionMint(log)){
                mintEvents.addLeft(log.transactionHash, log); // store for processing later
            } else if(isIncreaseLiquidity(log)){
                mintEvents.addRight(log.transactionHash, log); // store for processing later
            }else if(isLiquidityBurn(log)){
                liquidityDecreaseEvents.addLeft(log.transactionHash, log); // store for processing later
            }else if(isDecreasePositionLiquidity(log)){
                liquidityDecreaseEvents.addRight(log.transactionHash, log); // store for processing later
            }else if(isCollectPosition(log)){
                collectionEvents.addLeft(log.transactionHash, log); // store for processing later
            }else if(isPoolCollection(log)){
                collectionEvents.addRight(log.transactionHash, log); // store for processing later
            }
        }
    }

    // lets process the position mint events
    for(let [txHash, poolMint, increase] of mintEvents.getMatchedEntries()) {
        const result = await parseMint(ctx, poolMint, increase, transactionMap[txHash]!)

        if(result?.position) positions.push(result.position);

        if(result?.mint) mints.push(result.mint);
    }

    // insert position now so they can be used in future processing
    await ctx.store.insert(positions);

    // lets process the liquidity burn events
    for(let [txHash, burn, decrease] of liquidityDecreaseEvents.getMatchedEntries()) {
        const decreaseLiquidity = await parseLiquidityBurn(ctx, burn, decrease, transactionMap[txHash]!)
        if(decreaseLiquidity) liquidityDecreases.push(decreaseLiquidity)
    }

    // lets process the collection events
    for(let [txHash, managerCollect, poolCollect] of collectionEvents.getMatchedEntries()) {
       const collection = await parseCollect(ctx, managerCollect, poolCollect, transactionMap[txHash]!)
         if(collection) collects.push(collection)
    }

    for(let [trx, rawTrx] of transactions) {
        if(isBurn(rawTrx)) {
            const burn = await parseBurn(ctx, rawTrx, trx)
            if(burn) burns.push(burn);
        }
    }

    // save, order is important!
    await ctx.store.insert(blocks)
    await ctx.store.insert(transactions.map(t => t[0]))
    await ctx.store.insert(swaps)
    await ctx.store.insert(mints)
    await ctx.store.insert(liquidityDecreases)
    await ctx.store.insert(collects)
    await ctx.store.insert(burns)
})
