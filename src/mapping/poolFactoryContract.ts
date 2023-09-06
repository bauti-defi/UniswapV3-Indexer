
import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import * as spec from "../abi/poolFactory"
import { Store } from "@subsquid/typeorm-store"
import { Pool } from "../model"

export const isPoolCreation = (log: Log) => {
    return log.topics[0] === spec.events['PoolCreated'].topic
}

export const parsePoolCreation = (ctx: DataHandlerContext<Store>, log: Log) => {
    try {
        const event = spec.events['PoolCreated'].decode(log)

        return new Pool({
            id: log.id,
            chainId: 42161, // arbitrum
            token0: event[0],
            token1: event[1],
            fee: event[2],
            poolAddress: event[4],
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: log.block.height, blockHash: log.block.hash, address: log.address}, `Unable to decode event "${log.topics[0]}"`)
    }
}