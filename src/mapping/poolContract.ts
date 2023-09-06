import {DataHandlerContext} from '@subsquid/evm-processor'
import {Store} from '../db'
import * as poolSpec from "../abi/pool"
import * as managerSpec from "../abi/positionManager"
import {Log} from '../processor'
import { DecreasePositionLiquidity, Swap, Transaction } from '../model'
import { getPool } from '../pools'

export const isSwap = (log: Log) => {
    return log.topics[0] === poolSpec.events['Swap'].topic
}

export async function parseSwap(ctx: DataHandlerContext<Store>, log: Log, transaction: Transaction): Promise<Swap | undefined> {
    try {
        const event = poolSpec.events['Swap'].decode(log)

        return new Swap({
            id: log.id,
            transaction,
            pool: await getPool(log.address, ctx),
            recipient: event[1],
            amount0: event[2],
            amount1: event[3],
            sqrtPriceX96: event[4],
            liquidity: event[5],
            tick: event[6],
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: log.block.height, blockHash: log.block.hash, address: log.address}, `Unable to decode event "${log.topics[0]}"`)
    }
}

export const isPoolPositionMint = (log: Log) => {
    return log.topics[0] === poolSpec.events['Mint'].topic
}

export const isLiquidityBurn = (log: Log) => {
    return log.topics[0] === poolSpec.events['Burn'].topic
}

export async function parseLiquidityBurn(ctx: DataHandlerContext<Store>, burnLog: Log, decreaseLog: Log, transaction: Transaction): Promise<DecreasePositionLiquidity | undefined> {
    try {
        const [_owner, tickerLower, tickerUpper, amount, amount0, amount1] = poolSpec.events['Burn'].decode(burnLog)
        const [tokenId, _liquidity, _amount0, _amount1] = managerSpec.events['DecreaseLiquidity'].decode(decreaseLog)

        if(burnLog.transaction?.hash !== decreaseLog.transaction?.hash || burnLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        return new DecreasePositionLiquidity({
            id: burnLog.id,
            transaction,
            pool: await getPool(burnLog.address, ctx),
            tokenId,
            tickLower: tickerLower, 
            tickUpper: tickerUpper,
            amount0,
            amount1,
            liquidityDelta: amount
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: burnLog.block.height, blockHash: burnLog.block.hash, address: burnLog.address}, `Unable to decode event "${burnLog.topics[0]}"`)
    }
}