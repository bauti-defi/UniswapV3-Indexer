import {DataHandlerContext} from '@subsquid/evm-processor'
import {toJSON} from '@subsquid/util-internal-json'
import {Store} from '../db'
import {EntityBuffer} from '../entityBuffer'
import {ContractEventDecreaseLiquidity, ContractEventIncreaseLiquidity, ContractFunctionMint} from '../model'
import * as spec from '../abi/0xc36442b4a4522e871399cd717abdd847ab11fe88'
import {Log, Transaction} from '../processor'
import { ContractFunctionMintParameters } from '../model/generated/contractFunctionMintParameters.model'
import { ContractFunctionDecreaseLiquidity } from '../model/generated/contractFunctionDecreaseLiquidity.model'
import { ContractFunctionDecreaseLiquidityParameters } from '../model/generated/contractFunctionDecreaseLiquidityParameters.model'
import { calculatePoolAddress } from './utils'

const address = '0xc36442b4a4522e871399cd717abdd847ab11fe88'

export function parseEvent(ctx: DataHandlerContext<Store>, log: Log) {
    try {
        switch (log.topics[0]) {
            case spec.events['IncreaseLiquidity'].topic: {
                let e = spec.events['IncreaseLiquidity'].decode(log)
                EntityBuffer.add(
                    new ContractEventIncreaseLiquidity({
                        id: log.id,
                        blockNumber: log.block.height,
                        blockTimestamp: new Date(log.block.timestamp),
                        transactionHash: log.transactionHash,
                        contract: log.address,
                        eventName: 'IncreaseLiquidity',
                        tokenId: e[0],
                        liquidity: e[1],
                        amount0: e[2],
                        amount1: e[3],
                    })
                )
                break
            }
            case spec.events['DecreaseLiquidity'].topic: {
                let e = spec.events['DecreaseLiquidity'].decode(log)
                EntityBuffer.add(
                    new ContractEventDecreaseLiquidity({
                        id: log.id,
                        blockNumber: log.block.height,
                        blockTimestamp: new Date(log.block.timestamp),
                        transactionHash: log.transactionHash,
                        contract: log.address,
                        eventName: 'DecreaseLiquidity',
                        tokenId: e[0],
                        liquidity: e[1],
                        amount0: e[2],
                        amount1: e[3],
                    })
                )
                break
            }
        }
    }
    catch (error) {
        ctx.log.error({error, blockNumber: log.block.height, blockHash: log.block.hash, address}, `Unable to decode event "${log.topics[0]}"`)
    }
}


export function parseFunction(ctx: DataHandlerContext<Store>, transaction: Transaction) {
    try {
        switch (transaction.input.slice(0, 10)) {
            case spec.functions['mint'].sighash: {
                let f = spec.functions['mint'].decode(transaction.input)

                EntityBuffer.add(
                    new ContractFunctionMint({
                        id: transaction.id,
                        blockNumber: transaction.block.height,
                        blockTimestamp: new Date(transaction.block.timestamp),
                        transactionHash: transaction.hash,
                        contract: transaction.to!,
                        functionName: 'mint',
                        functionValue: transaction.value,
                        functionSuccess: transaction.status != null ? Boolean(transaction.status) : undefined,
                    })
                )

                const params = toJSON(f[0])
                const poolAddress = calculatePoolAddress(params[0], params[1], params[2])

                EntityBuffer.add(
                    new ContractFunctionMintParameters({
                        id: transaction.id,
                        pool: poolAddress,
                        token0: params[0],
                        token1: params[1],
                        fee: params[2],
                        tickLower: params[3],
                        tickUpper: params[4],
                        amount0Desired: params[5],
                        amount1Desired: params[6],
                        amount0Min: params[7],
                        amount1Min: params[8],
                        recipient: params[9],
                        deadline: params[10],
                    })
                )

                break
            }
            case spec.functions['decreaseLiquidity'].sighash: {
                let f = spec.functions['decreaseLiquidity'].decode(transaction.input)
                EntityBuffer.add(
                    new ContractFunctionDecreaseLiquidity({
                        id: transaction.id,
                        blockNumber: transaction.block.height,
                        blockTimestamp: new Date(transaction.block.timestamp),
                        transactionHash: transaction.hash,
                        contract: transaction.to!,
                        functionName: 'decreaseLiquidity',
                        functionValue: transaction.value,
                        functionSuccess: transaction.status != null ? Boolean(transaction.status) : undefined
                    })
                )

                const params = toJSON(f[0])

                EntityBuffer.add(
                    new ContractFunctionDecreaseLiquidityParameters({
                        id: transaction.id,
                        tokenId: params[0],
                        liquidity: params[1],
                        amount0Min: params[2],
                        amount1Min: params[3],
                        deadline: params[4]
                    })
                )
                break
            }
        }
    }
    catch (error) {
        ctx.log.error({error, blockNumber: transaction.block.height, blockHash: transaction.block.hash, address}, `Unable to decode function "${transaction.input.slice(0, 10)}"`)
    }
}
