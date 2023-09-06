import {DataHandlerContext} from '@subsquid/evm-processor'
import {Store} from '../db'
import * as spec from "../abi/pool"
import {Log} from '../processor'
import { Swap, Transaction } from '../model'
import { getPool, getPoolFromAddress } from '../pools'
import { utils } from 'web3'

export const isSwap = (log: Log) => {
    return log.topics[0] === spec.events['Swap'].topic
}

export async function parseSwap(ctx: DataHandlerContext<Store>, log: Log, transaction: Transaction): Promise<Swap | undefined> {
    try {
        const event = spec.events['Swap'].decode(log)

        return new Swap({
            id: log.id,
            transaction,
            pool: await getPool(utils.toChecksumAddress(log.address), ctx),
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
    return log.topics[0] === spec.events['Mint'].topic
}
