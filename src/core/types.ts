import {Log as _Log, Transaction as _Transaction} from '@subsquid/evm-processor'
import {Block, BurnPosition, CollectionPosition, DecreasePositionLiquidity, IncreasePositionLiquidity, MintPosition, Position, PositionTransfer, Swap, Transaction} from '../model'
import {Log, BlockTransaction} from './processor'
import Matcher from '../utils/matcher'

export type ChainRpc = Readonly<string | {
    url: string
    capacity?: number
    rateLimit?: number
    requestTimeout?: number
    maxBatchCallSize?: number
}>

export type ExecutionContext = Readonly<{
    readonly blocks: Block[]
    readonly transactions: [Transaction, BlockTransaction][]
    readonly swaps: Swap[]
    readonly mints: MintPosition[]
    readonly liquidityDecreases: DecreasePositionLiquidity[]
    readonly liquidityIncreases: IncreasePositionLiquidity[]
    readonly collects: CollectionPosition[]
    readonly burns: BurnPosition[]
    readonly positions: Position[]
    readonly transfers: PositionTransfer[]

    readonly positionTransferLogs: Log[]
    readonly transactionMap: Record<string, Transaction>
    readonly collectionEvents: Matcher<Log, Log>
    readonly liquidityDecreaseEvents: Matcher<Log, Log>
    readonly mintEvents: Matcher<BlockTransaction, Log>
    readonly poolMintEventMap: Record<string, Log>
    readonly increaseLiquidityEventMap: Record<string, Log>
}>;

