import {DataHandlerContext} from '@subsquid/evm-processor'
import {Store} from '../db'
import * as poolSpec from "../abi/pool"
import {Log} from '../processor'
import { Swap, Transaction } from '../model'
import { getPoolByAddressThunk } from '../utils/pools'

import { v4 as uuidv4 } from 'uuid';

export const isSwap = (log: Log) => {
    return log.topics[0] === poolSpec.events['Swap'].topic
}

export async function parseSwap(ctx: DataHandlerContext<Store>, log: Log, transaction: Transaction): Promise<Swap | undefined> {
    try {
        const [_owner, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick] = poolSpec.events['Swap'].decode(log)

        return new Swap({
            id: uuidv4(),
            transaction,
            logIndex: log.logIndex,
            pool: await getPoolByAddressThunk(log.address, ctx),
            recipient,
            amount0,
            amount1,
            sqrtPriceX96,
            liquidity,
            tick,
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
