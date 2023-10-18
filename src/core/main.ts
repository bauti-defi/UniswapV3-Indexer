import {processor, Log, BlockTransaction} from './processor'
import {db} from './db'
import {Block, BurnPosition, CollectionPosition, DecreasePositionLiquidity, IncreasePositionLiquidity, MintPosition, Position, PositionTransfer, Swap, Transaction} from '../model'
import { isLiquidityBurn, isPoolCollection, isSwap, parseSwap } from '../mapping/poolContract'
import { isBurn, isCollectPosition, isDecreasePositionLiquidity, isIncreaseLiquidity, isMintTransaction, isTransferPositionLog } from '../mapping/positionManagerContract'
import { parseMint, parseLiquidityBurn, parseLiquidityIncrease, parseTransfer } from '../mapping/position'
import Matcher from '../utils/matcher'
import { parseCollect } from '../mapping/position'
import { parseBurn } from '../mapping/position'
import { chainId } from '../utils/chain'
import { utils } from 'web3'
import { poolAddressesOfInterest, poolsOfInterest, populatePoolsTable } from '../pools'
import { POSITION_MANAGER_ADDRESS } from './const'
import { v4 as uuidv4 } from 'uuid';

type ExecutionContext = Readonly<{
    readonly blocks: Block[]
    readonly transactions: [Transaction, BlockTransaction][]
    readonly swaps: Swap[]
    readonly mints: MintPosition[]
    readonly liquidityDecreases: DecreasePositionLiquidity[]
    readonly liquidityIncreases: IncreasePositionLiquidity[]
    readonly collects: CollectionPosition[]
    readonly burns: BurnPosition[]
    readonly positions: Position[]
    readonly transfers: PositionTransfer[]

    readonly positionTransferLogs: Log[]
    readonly transactionMap: Record<string, Transaction>
    readonly collectionEvents: Matcher<Log, Log>
    readonly liquidityDecreaseEvents: Matcher<Log, Log>
    readonly mintEvents: Matcher<BlockTransaction, Log>
    readonly poolMintEventMap: Record<string, Log>
    readonly increaseLiquidityEventMap: Record<string, Log>
}>;

const newExecutionContext = (): ExecutionContext => {
    return {
        blocks: [],
        transactions: [],
        swaps: [],
        mints: [],
        liquidityDecreases: [],
        liquidityIncreases: [],
        collects: [],
        burns: [],
        positions: [],
        transfers: [],

        positionTransferLogs: [],
        transactionMap: {},
        liquidityDecreaseEvents: new Matcher(),
        collectionEvents: new Matcher(),
        mintEvents: new Matcher(),
        poolMintEventMap: {},
        increaseLiquidityEventMap: {}
    }
}

function shouldPersistExecutionContext(ctx: ExecutionContext): boolean {
    return ctx.swaps.length > 0 || ctx.mints.length > 0 || ctx.liquidityDecreases.length > 0 || ctx.liquidityIncreases.length > 0 || ctx.collects.length > 0 || ctx.burns.length > 0 || ctx.transfers.length > 0 || ctx.positions.length > 0
}

function getMetrics(ctx: ExecutionContext): string {
    const metrics = {
        blockCount: ctx.blocks.length,
        transactionCount: ctx.transactions.length,
        swapCount: ctx.swaps.length,
        mintCount: ctx.mints.length,
        liquidityIncreaseCount: ctx.liquidityIncreases.length,
        liquidityDecreaseCount: ctx.liquidityDecreases.length,
        collectionCount: ctx.collects.length,
        burnCount: ctx.burns.length,
        positionCount: ctx.positions.length,
        positionTransferCount: ctx.transfers.length,
        transactionMapKeys: Object.keys(ctx.transactionMap).length
    };
    
    return JSON.stringify(metrics, null, 2);
}

const addressesOfInterest: string[] = [...poolAddressesOfInterest, POSITION_MANAGER_ADDRESS]

const isAddressOfInterest = (address: string): boolean => addressesOfInterest.includes(utils.toChecksumAddress(address))

let poolsCreated = false

processor.run(db, async (ctx) => {
    if(!poolsCreated) {
        await populatePoolsTable(ctx, poolsOfInterest());
        poolsCreated = true;

        ctx.log.info(`Pools table populated with pools of interest`);
    }

    let execContext = newExecutionContext();
    let {blocks, positionTransferLogs, transfers, transactionMap, transactions, swaps, mints, liquidityDecreaseEvents, liquidityDecreases, mintEvents, collectionEvents, collects, burns, positions, liquidityIncreases} = execContext;

    for (let block of ctx.blocks) {
        const newBlock = new Block({
            id: uuidv4(),
            chainId: chainId(), 
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp),
        })

        blocks.push(newBlock);

        for(let rawTrx of block.transactions) {
            const transaction = new Transaction({
                id: uuidv4(),
                block: newBlock,
                transactionIndex: rawTrx.transactionIndex,
                hash: rawTrx!.hash,
                trxTo: utils.toChecksumAddress(rawTrx.to ? rawTrx.to : rawTrx.contractAddress!),
                toContract: rawTrx.contractAddress ? true : false,
                trxFrom: utils.toChecksumAddress(rawTrx!.from),
                status: rawTrx!.status,
                gasUsed: rawTrx!.gasUsed
            })

            transactions.push([transaction, rawTrx]);
            transactionMap[transaction.hash] = transaction;

            if(isMintTransaction(rawTrx) && rawTrx?.to && utils.toChecksumAddress(rawTrx.to) === POSITION_MANAGER_ADDRESS) {
                mintEvents.addLeft(rawTrx.hash, rawTrx)
            }
        }
        
        for (let log of block.logs) {

            // Only process transactions that are to a pool of interest
            // we must make this check manually for real-time hotblock indexing
            if(!isAddressOfInterest(log.address)) {
                continue
            }

            // if(isPoolCreation(log)) {
            //     const pool = parsePoolCreation(ctx, log)
            //     if(pool) await ctx.store.insert(pool); // lets store right away for future use
            // }

            if (isSwap(log)) {
                const swap = await parseSwap(ctx, log, transactionMap[log.transactionHash])
                if(swap) swaps.push(swap);
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
            }else if(isTransferPositionLog(log)){
                positionTransferLogs.push(log); // store for processing later
            }
        }
    }

    // lets process the position mint events
    for(let [txHash, poolMint, increase] of mintEvents.getMatchedEntries()) {
        const [position, mint] = await parseMint(ctx, poolMint, increase, transactionMap[txHash])

        if(position && mint) {
            positions.push(position);
            mints.push(mint);
        }
    }

    // insert position now so they can be used in future processing
    await ctx.store.insert(positions);

    // lets process position transfers that are not mints
    for(let transfer of positionTransferLogs) {
        const positionTransfer = await parseTransfer(ctx, transfer, transactionMap[transfer.transactionHash])

        if(positionTransfer) transfers.push(positionTransfer);
    }

    // lets process the liquidity increase events
    for(let [txHash, increase] of mintEvents.getUnmatchedRight()) {
        const increaseLiquidity = await parseLiquidityIncrease(ctx, increase, transactionMap[txHash])

        if(increaseLiquidity) liquidityIncreases.push(increaseLiquidity)
    }

    // lets process the liquidity burn events
    for(let [txHash, burn, decrease] of liquidityDecreaseEvents.getMatchedEntries()) {
        const decreaseLiquidity = await parseLiquidityBurn(ctx, burn, decrease, transactionMap[txHash])

        if(decreaseLiquidity) liquidityDecreases.push(decreaseLiquidity)
    }

    // lets process the collection events
    for(let [txHash, managerCollect, poolCollect] of collectionEvents.getMatchedEntries()) {
        const collection = await parseCollect(ctx, managerCollect, poolCollect, transactionMap[txHash])

        if(collection) collects.push(collection)
    }

    for(let [trx, rawTrx] of transactions) {
        if(isBurn(rawTrx)) {
            const burn = await parseBurn(ctx, rawTrx, trx)
            if(burn) burns.push(burn);
        }
    }

    // make sure to not persist useless blocks/transactions
    if(shouldPersistExecutionContext(execContext)){

        // save, order is important!
        await ctx.store.insert(blocks)
        await ctx.store.insert(transactions.map(t => t[0]))
        await Promise.all([
            ctx.store.insert(swaps),
            ctx.store.insert(mints),
            ctx.store.insert(transfers),
            ctx.store.insert(liquidityIncreases),
            ctx.store.insert(liquidityDecreases),
            ctx.store.insert(collects),
            ctx.store.insert(burns)
        ])

        ctx.log.info("Persisted execution context in DB");
    }
    
    ctx.log.info(getMetrics(execContext));
})
