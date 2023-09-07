import {DataHandlerContext} from '@subsquid/evm-processor'
import {Store} from '../db'
import * as poolSpec from "../abi/pool"
import {Log} from '../processor'
import { Swap, Transaction } from '../model'
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
            logIndex: log.logIndex,
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

export const isPoolCollection = (log: Log) => {
    return log.topics[0] === poolSpec.events['Collect'].topic
}
