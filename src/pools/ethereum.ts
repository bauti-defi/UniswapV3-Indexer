import { FeeAmount } from "@uniswap/v3-sdk"
import { Pool } from "./types"

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F' as const

// pulled manually from arbiscan
export const ETH_POOLS_OF_INTEREST: readonly Pool[] = [
    {
        token0: USDC,
        token1: USDT,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 13609065 
    },
    {
        token0: DAI,
        token1: USDT,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 15142784  
    },
    {
        token0: DAI,
        token1: USDC,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 13605124 
    }
]