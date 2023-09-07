import { Log } from "@subsquid/evm-processor"
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