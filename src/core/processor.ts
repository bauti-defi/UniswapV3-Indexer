import {EvmBatchProcessor, EvmBatchProcessorFields, BlockHeader, Log as _Log, Transaction as _Transaction} from '@subsquid/evm-processor'
import {KnownArchivesEVM, lookupArchive} from '@subsquid/archive-registry'
import * as poolAbi from '../abi/pool'
import * as positionManagerAbi from '../abi/positionManager'
import { chainId } from '../utils/chain'
import { poolAddressesOfInterest, poolsOfInterest } from '../pools'
import { POSITION_MANAGER_ADDRESS } from './const'
import { ChainRpc } from './types'

const lowestBlock: number = poolsOfInterest().reduce((acc, pool) => Math.min(acc, pool.deployedAtBlock), Number.MAX_SAFE_INTEGER)

const networkName = (): KnownArchivesEVM => {
    switch(chainId()){
        case 1: return 'eth-mainnet'
        case 10: 'optimism-mainnet'
        case 42161: return 'arbitrum'
        default: throw new Error('Unknown network for name!')
    }
}

const rpcURL = (): string => {
    switch(chainId()){
        case 1: return process.env.ETH_RPC_ENDPOINT!
        case 10: return process.env.OP_RPC_ENDPOINT!
        case 42161: return process.env.ARB_RPC_ENDPOINT!
        default: throw new Error('Unknown network for rpc!')
    }
}

/**
 * 
 * url: rpc endpoint
 * maxBatchCallSize: max number of calls in a batch
 * rateLimit: number of requests per second
 * capacity: number of concuerrent connections
 * requestTimeout: timeout in seconds
 * 
 */
const networkRPC = (): ChainRpc  => {
    switch(chainId()){
        case 1: return {
            url: rpcURL(),
            maxBatchCallSize: 100,
            capacity: 5,
            rateLimit: 2
        }
        case 10: return rpcURL()
        case 42161: return {
            url: rpcURL(),
            maxBatchCallSize: 30, // Arbitrum rpc providers have problems when this is too large
            rateLimit: 10, 
            capacity: 5 
        }
        default: throw new Error('Unknown network for rpc!')
    }
}

export const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: lookupArchive(networkName(), {type: 'EVM'}),
        chain: networkRPC()
    })
    .setChainPollInterval(10000)
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
                contractAddress: true,
        }
    })
    .setFinalityConfirmation(20)
    .addLog({
        address: poolAddressesOfInterest,
        topic0: [
            poolAbi.events['Swap'].topic,
            poolAbi.events['Burn'].topic,
            poolAbi.events['Collect'].topic,
        ],
        transaction: true,
        range: {
            from: lowestBlock,
        },
    })
    .addLog({
        address: [POSITION_MANAGER_ADDRESS],
        topic0: [
            positionManagerAbi.events['IncreaseLiquidity'].topic,
            positionManagerAbi.events['DecreaseLiquidity'].topic,
            positionManagerAbi.events['Collect'].topic,
            positionManagerAbi.events['Transfer'].topic,
        ],
        transaction: true,
        range: {
            from: lowestBlock,
        },
    })
    .addTransaction({
        to: [POSITION_MANAGER_ADDRESS],
        sighash: [
            positionManagerAbi.functions['burn'].sighash,
            positionManagerAbi.functions['mint'].sighash,
        ],
        range: {
            from: lowestBlock,
        },
    })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type BlockTransaction = _Transaction<Fields>
