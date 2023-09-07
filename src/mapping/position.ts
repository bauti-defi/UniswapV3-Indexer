import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import { Store } from "@subsquid/typeorm-store"
import { utils } from "web3"
import { DecreasePositionLiquidity, MintPosition, Swap, Transaction, CollectionPosition } from "../model"
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
            logIndex: increaseLog.logIndex, // this will always be emitted after the mint event
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
            logIndex: decreaseLog.logIndex, // this will always be emitted after the burn event
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

export async function parseCollect(ctx: DataHandlerContext<Store>, managerLog: Log, poolLog: Log, transaction: Transaction): Promise<CollectionPosition | undefined> {
    try {
        const [tokenId, recipient, amount0Collected, amount1Collected] = managerSpec.events['Collect'].decode(managerLog)
        const [_owner, _recipient, tickLower, tickUpper, _amount0Collected, _amount1Collected] = poolSpec.events['Collect'].decode(poolLog);

        if(managerLog.transaction?.hash !== poolLog.transaction?.hash || managerLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        return new CollectionPosition({
            id: managerLog.id,
            transaction,
            logIndex: managerLog.logIndex, // this will always be emitted after the collect event
            pool: await getPool(poolLog.address, ctx),
            tokenId,
            tickLower,
            tickUpper,
            recipient,
            amount0Collected,
            amount1Collected,
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: managerLog.block.height, blockHash: managerLog.block.hash, address: managerLog.address}, `Unable to decode event "${managerLog.topics[0]}"`)
    }
}