import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import { Store } from "@subsquid/typeorm-store"
import { utils } from "web3"
import { DecreasePositionLiquidity, MintPosition, Transaction, CollectionPosition, BurnPosition, Position, IncreasePositionLiquidity, PositionTransfer } from "../model"

import * as poolSpec from "../abi/pool"
import * as managerSpec from "../abi/positionManager"
import { BlockTransaction } from "../core/processor"
import { getPositionByTokenIdThunk } from "../utils/positions"
import { v4 as uuidv4 } from 'uuid';
import { calculatePoolAddress, getPoolByAddressThunk, isPoolAddressOfInterest } from "../pools"

export async function parseMint(ctx: DataHandlerContext<Store>, mintTrx: BlockTransaction, increaseLog: Log, transaction: Transaction): Promise<[Position, MintPosition] | [undefined, undefined]> {
    try {
        const params = managerSpec.functions['mint'].decode(mintTrx.input)
        const [token0, token1, fee, tickLower, tickUpper, _amount0Desired, _amount1Desired, _amount0Min, _amount1Min, recipient, _deadline] = params[0]
        const [tokenId, liquidity, amount0, amount1] = managerSpec.events['IncreaseLiquidity'].decode(increaseLog)

        if(mintTrx?.hash !== increaseLog.transaction?.hash || mintTrx?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')
        
        const poolAddress = calculatePoolAddress(token0, token1, fee)

        if(!isPoolAddressOfInterest(poolAddress)) return [undefined, undefined]

        const position = new Position({
            id: uuidv4(),
            pool: await getPoolByAddressThunk(poolAddress, ctx),
            tokenId,
            tickLower,
            tickUpper,
            chainId: transaction.block.chainId,
        })

        const mintPosition = new MintPosition({
            id: uuidv4(),
            transaction,
            logIndex: increaseLog.logIndex, // this will always be emitted after the mint event
            position,
            recipient: utils.toChecksumAddress(recipient),
            liquidity,
            amount0,
            amount1,
        })

        return [position, mintPosition]
    }
    catch (error) {
        ctx.log.error({error, blockNumber: mintTrx.block.height, blockHash: mintTrx.block.hash, address: mintTrx.from}, `Unable to decode event "${increaseLog.topics[0]}"`)
        
        return [undefined, undefined]
    }
}

export async function parseLiquidityBurn(ctx: DataHandlerContext<Store>, burnLog: Log, decreaseLog: Log, transaction: Transaction): Promise<DecreasePositionLiquidity | undefined> {
    try {
        const [_owner, _tickLower, _tickUpper, amount, amount0, amount1] = poolSpec.events['Burn'].decode(burnLog)
        const [tokenId, _liquidity, _amount0, _amount1] = managerSpec.events['DecreaseLiquidity'].decode(decreaseLog)

        if(burnLog.transaction?.hash !== decreaseLog.transaction?.hash || burnLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        const position = await getPositionByTokenIdThunk(tokenId, ctx)

        return position && new DecreasePositionLiquidity({
            id: uuidv4(),
            transaction,
            logIndex: decreaseLog.logIndex, // this will always be emitted after the burn event
            position,
            amount0,
            amount1,
            liquidityDelta: amount
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: burnLog.block.height, blockHash: burnLog.block.hash, address: burnLog.address}, `Unable to decode event "${burnLog.topics[0]}"`)
    }
}

export async function parseCollect(ctx: DataHandlerContext<Store>, managerLog: Log, poolLog: Log, transaction: Transaction): Promise<CollectionPosition | undefined> {
    try {
        const [tokenId, recipient, amount0Collected, amount1Collected] = managerSpec.events['Collect'].decode(managerLog)
        const [_owner, _recipient, _tickLower, _tickUpper, _amount0Collected, _amount1Collected] = poolSpec.events['Collect'].decode(poolLog);

        if(managerLog.transaction?.hash !== poolLog.transaction?.hash || managerLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        const position = await getPositionByTokenIdThunk(tokenId, ctx)

        return position && new CollectionPosition({
            id: uuidv4(),
            transaction,
            logIndex: managerLog.logIndex, // this will always be emitted after the collect event
            position,
            recipient: utils.toChecksumAddress(recipient),
            amount0Collected,
            amount1Collected,
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: managerLog.block.height, blockHash: managerLog.block.hash, address: managerLog.address}, `Unable to decode event "${managerLog.topics[0]}"`)
    }
}

export const parseLiquidityIncrease = async (ctx: DataHandlerContext<Store>, increaseLog: Log, transaction: Transaction) => {
    try {
        const [tokenId, liquidity, amount0, amount1] = managerSpec.events['IncreaseLiquidity'].decode(increaseLog)

        const position = await getPositionByTokenIdThunk(tokenId, ctx)

        return position && new IncreasePositionLiquidity({
            id: uuidv4(),
            position,
            transaction,
            logIndex: increaseLog.logIndex,
            liquidityDelta: liquidity,
            amount0,
            amount1,
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: increaseLog.block.height, blockHash: increaseLog.block.hash, address: increaseLog.address}, `Unable to decode event "${increaseLog.topics[0]}"`)
    }
}

export const parseBurn = async (ctx: DataHandlerContext<Store>, rawTrx: BlockTransaction, transaction: Transaction) => {
    try {
        const [tokenId] = managerSpec.functions['burn'].decode(rawTrx.input)

        const position = await getPositionByTokenIdThunk(tokenId, ctx);

        return position && new BurnPosition({
            id: uuidv4(),
            position,
            transaction,
            transactionIndex: transaction.transactionIndex
        })
    }catch(error){
        ctx.log.error({error, blockNumber: rawTrx.block.height, blockHash: rawTrx.block.hash, transactionHash: transaction.hash}, `Unable to decode burn transaction`)
    }
}

export const parseTransfer = async (ctx: DataHandlerContext<Store>, transferLog: Log, transaction: Transaction) => {
    try {
        const [from, to, tokenId] = managerSpec.events['Transfer'].decode(transferLog)

        const position = await getPositionByTokenIdThunk(tokenId, ctx);

        return position && new PositionTransfer({
            id: uuidv4(),
            position,
            transaction,
            logIndex: transferLog.logIndex,
            transferFrom: utils.toChecksumAddress(from),
            transferTo: utils.toChecksumAddress(to),
        })
    }catch(error){
        ctx.log.error({error, blockNumber: transferLog.block.height, blockHash: transferLog.block.hash, transactionHash: transaction.hash}, `Unable to decode burn transaction`)
    }
}