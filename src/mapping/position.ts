import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import { Store } from "@subsquid/typeorm-store"
import { utils } from "web3"
import { DecreasePositionLiquidity, MintPosition, Swap, Transaction } from "../model"
import { getPool } from "../pools"

import * as poolSpec from "../abi/pool"
import * as managerSpec from "../abi/positionManager"

export async function parseMint(ctx: DataHandlerContext<Store>, mintLog: Log, increaseLog: Log, transaction: Transaction): Promise<MintPosition | undefined> {
    try {
        const [_, recipient, tickLower, tickUpper, liquidity, amount0, amount1] = poolSpec.events['Mint'].decode(mintLog)
        const [tokenId, _liquidity, _amount0, _amount1] = managerSpec.events['IncreaseLiquidity'].decode(increaseLog)

        if(mintLog.transaction?.hash !== increaseLog.transaction?.hash || mintLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        return new MintPosition({
            id: mintLog.id,
            transaction,
            pool: await getPool(utils.toChecksumAddress(mintLog.address), ctx),
            recipient,
            tickLower,
            tickUpper,
            liquidity,
            amount0,
            amount1,
            tokenId,
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: mintLog.block.height, blockHash: mintLog.block.hash, address: mintLog.address}, `Unable to decode event "${mintLog.topics[0]}"`)
    }
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