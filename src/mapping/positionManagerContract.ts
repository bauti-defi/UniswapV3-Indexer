import { Log } from "@subsquid/evm-processor"
import * as spec from "../abi/positionManager"

export const isIncreaseLiquidity = (log: Log) => {
    return log.topics[0] === spec.events['IncreaseLiquidity'].topic
}

