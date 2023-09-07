
import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import * as spec from "../abi/poolFactory"
import { Store } from "@subsquid/typeorm-store"
import { Pool } from "../model"

import { v4 as uuidv4 } from 'uuid';
import { chainId } from "../utils/chain";

export const isPoolCreation = (log: Log) => {
    return log.topics[0] === spec.events['PoolCreated'].topic
}

export const parsePoolCreation = (ctx: DataHandlerContext<Store>, log: Log) => {
    try {
        const [token0, token1, fee, _, poolAddress] = spec.events['PoolCreated'].decode(log)

        return new Pool({
            id: uuidv4(),
            chainId: chainId(),
            token0,
            token1,
            fee,
            poolAddress,
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: log.block.height, blockHash: log.block.hash, address: log.address}, `Unable to decode event "${log.topics[0]}"`)
    }
}