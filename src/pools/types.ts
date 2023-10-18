import { FeeAmount } from "@uniswap/v3-sdk"

export type Pool = Readonly<{
    token0: string
    token1: string
    fee: FeeAmount
    deployedAtBlock: number
}>;