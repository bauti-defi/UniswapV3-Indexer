import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import { Store } from "@subsquid/typeorm-store"
import { utils } from "web3"
import { MintPosition, Swap, Transaction } from "../model"
import { getPool } from "../pools"

import * as poolSpec from "../abi/pool"
import * as positionManagerSpec from "../abi/positionManager"

export async function parseMint(ctx: DataHandlerContext<Store>, poolLog: Log, managerLog: Log, transaction: Transaction): Promise<MintPosition | undefined> {
    try {
        const poolEvent = poolSpec.events['Mint'].decode(poolLog)
        const managerEvent = positionManagerSpec.events['IncreaseLiquidity'].decode(managerLog)

        if(poolLog.transaction?.hash !== managerLog.transaction?.hash || poolLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        return new MintPosition({
            id: poolLog.id,
            transaction,
            pool: await getPool(utils.toChecksumAddress(poolLog.address), ctx),
            recipient: poolEvent[1],
            tickLower: poolEvent[2],
            tickUpper: poolEvent[3],
            liquidity: poolEvent[4],
            amount0: poolEvent[5],
            amount1: poolEvent[6],
            tokenId: managerEvent[0],
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: poolLog.block.height, blockHash: poolLog.block.hash, address: poolLog.address}, `Unable to decode event "${poolLog.topics[0]}"`)
    }
}

// export async function parseBurn(ctx: DataHandlerContext<Store>, poolLog: Log, managerLog: Log, transaction: Transaction): Promise<MintPosition | undefined> {
//     try {
//         const poolEvent = poolSpec.events['Burn'].decode(poolLog)
//         const managerEvent = positionManagerSpec.events['DecreaseLiquidity'].decode(managerLog)

//         if(poolLog.transaction?.hash !== managerLog.transaction?.hash || poolLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

//         return new MintPosition({
//             id: poolLog.id,
//             transaction,
//             pool: await getPool(utils.toChecksumAddress(poolLog.address), ctx),
//             recipient: poolEvent[1],
//             tickLower: poolEvent[2],
//             tickUpper: poolEvent[3],
//             liquidity: poolEvent[4],
//             amount0: poolEvent[5],
//             amount1: poolEvent[6],
//             tokenId: managerEvent[0],
//         })
//     }
//     catch (error) {
//         ctx.log.error({error, blockNumber: poolLog.block.height, blockHash: poolLog.block.hash, address: poolLog.address}, `Unable to decode event "${poolLog.topics[0]}"`)
//     }
// }
