import {DataHandlerContext} from '@subsquid/evm-processor'
import {toJSON} from '@subsquid/util-internal-json'
import {Store} from '../db'
import {EntityBuffer} from '../entityBuffer'
import {ContractFunctionExactInputSingle} from '../model'
import * as spec from '../abi/0xe592427a0aece92de3edee1f18e0157c05861564'
import {Log, Transaction} from '../processor'

const address = '0xe592427a0aece92de3edee1f18e0157c05861564'


export function parseEvent(ctx: DataHandlerContext<Store>, log: Log) {
    try {
        switch (log.topics[0]) {
        }
    }
    catch (error) {
        ctx.log.error({error, blockNumber: log.block.height, blockHash: log.block.hash, address}, `Unable to decode event "${log.topics[0]}"`)
    }
}

export function parseFunction(ctx: DataHandlerContext<Store>, transaction: Transaction) {
    try {
        switch (transaction.input.slice(0, 10)) {
            case spec.functions['exactInputSingle'].sighash: {
                let f = spec.functions['exactInputSingle'].decode(transaction.input)
                EntityBuffer.add(
                    new ContractFunctionExactInputSingle({
                        id: transaction.id,
                        blockNumber: transaction.block.height,
                        blockTimestamp: new Date(transaction.block.timestamp),
                        transactionHash: transaction.hash,
                        contract: transaction.to!,
                        functionName: 'exactInputSingle',
                        functionValue: transaction.value,
                        functionSuccess: transaction.status != null ? Boolean(transaction.status) : undefined,
                        params: toJSON(f[0]),
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
