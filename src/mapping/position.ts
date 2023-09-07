import { DataHandlerContext, Log } from "@subsquid/evm-processor"
import { Store } from "@subsquid/typeorm-store"
import { utils } from "web3"
import { DecreasePositionLiquidity, MintPosition, Swap, Transaction, CollectionPosition, BurnPosition, Position } from "../model"
import { getPoolByAddressThunk } from "../utils/pools"

import * as poolSpec from "../abi/pool"
import * as managerSpec from "../abi/positionManager"
import { BlockTransaction } from "../processor"
import { getPositionByTokenIdThunk } from "../utils/positions"
import { v4 as uuidv4 } from 'uuid';

export async function parseMint(ctx: DataHandlerContext<Store>, mintLog: Log, increaseLog: Log, transaction: Transaction): Promise<[Position | undefined, MintPosition | undefined]> {
    try {
        const [_sender, _owner, tickLower, tickUpper, liquidity, amount0, amount1] = poolSpec.events['Mint'].decode(mintLog)
        const [tokenId, _liquidity, _amount0, _amount1] = managerSpec.events['IncreaseLiquidity'].decode(increaseLog)

        if(mintLog.transaction?.hash !== increaseLog.transaction?.hash || mintLog.transaction?.hash !== transaction.hash) throw Error('Transaction hash is NOT the same for all logs')

        const position = new Position({
            id: uuidv4(),
            pool: await getPoolByAddressThunk(utils.toChecksumAddress(mintLog.address), ctx),
            tokenId,
            tickLower,
            tickUpper,
        })

        const mintPosition = new MintPosition({
            id: uuidv4(),
            transaction,
            logIndex: increaseLog.logIndex, // this will always be emitted after the mint event
            position,
            recipient: transaction.from, // TODO: make sure this is correct
            liquidity,
            amount0,
            amount1,
        })

        return [position, mintPosition]
    }
    catch (error) {
        ctx.log.error({error, blockNumber: mintLog.block.height, blockHash: mintLog.block.hash, address: mintLog.address}, `Unable to decode event "${mintLog.topics[0]}"`)
        
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
            recipient,
            amount0Collected,
            amount1Collected,
        })
    }
    catch (error) {
        ctx.log.error({error, blockNumber: managerLog.block.height, blockHash: managerLog.block.hash, address: managerLog.address}, `Unable to decode event "${managerLog.topics[0]}"`)
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