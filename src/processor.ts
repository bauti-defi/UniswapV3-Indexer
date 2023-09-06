import {EvmBatchProcessor, EvmBatchProcessorFields, BlockHeader, Log as _Log, Transaction as _Transaction} from '@subsquid/evm-processor'
import {lookupArchive} from '@subsquid/archive-registry'
import * as positionManagerAbi from './abi/positionManager'
import * as swapRouterAbi from './abi/swapRouter'

export const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: lookupArchive('arbitrum', {type: 'EVM'}),
        chain: process.env.ARB_RPC_ENDPOINT
    })
    .setFields({
            log: {
                topics: true,
                data: true,
                transactionHash: true,
            },
            transaction: {
                hash: true,
                input: true,
                from: true,
                value: true,
                to: true,
                chainId: true,
                gasUsed: true,
                status: true,
        }
    })
    .setFinalityConfirmation(10)
    .addLog({
        address: ['0xc36442b4a4522e871399cd717abdd847ab11fe88'],
        topic0: [
            positionManagerAbi.events['IncreaseLiquidity'].topic,
            positionManagerAbi.events['DecreaseLiquidity'].topic,
        ],
        range: {
            from: 121460117,
        },
    })
    .addTransaction({
        to: ['0xc36442b4a4522e871399cd717abdd847ab11fe88', '0xe592427a0aece92de3edee1f18e0157c05861564'],
        sighash: [
            positionManagerAbi.functions['mint'].sighash,
            positionManagerAbi.functions['increaseLiquidity'].sighash,
            positionManagerAbi.functions['decreaseLiquidity'].sighash,
            swapRouterAbi.functions['exactInputSingle'].sighash
        ],
        range: {
            from: 121460117,
        },
    })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
