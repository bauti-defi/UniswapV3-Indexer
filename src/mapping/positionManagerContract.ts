import {BlockTransaction, Log} from '../core/processor'
import * as spec from "../abi/positionManager"

export const isIncreaseLiquidity = (log: Log) => {
    return log.topics[0] === spec.events['IncreaseLiquidity'].topic
}

export const isDecreasePositionLiquidity = (log: Log) => {
    return log.topics[0] === spec.events['DecreaseLiquidity'].topic
}

export const isCollectPosition = (log: Log) => {
    return log.topics[0] === spec.events['Collect'].topic
}

export const isBurn = (transaction: BlockTransaction) => {
    return transaction.input.slice(0, 10) === spec.functions['burn'].sighash;
}

export const isMintTransaction = (transaction: BlockTransaction) => {
    return transaction.input.slice(0, 10) === spec.functions['mint'].sighash;
}

export const isTransferPositionLog = (log: Log) => {
    return log.topics[0] === spec.events['Transfer'].topic
}