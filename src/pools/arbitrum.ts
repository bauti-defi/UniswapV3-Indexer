import { FeeAmount } from "@uniswap/v3-sdk"
import { Pool } from "./types"

const ARB_USDCe = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as const
const ARB_USDT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as const
const ARB_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const
const ARB_DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as const

// pulled manually from arbiscan
export const ARBI_POOLS_OF_INTEREST: readonly Pool[] = [
    {
        token0: ARB_USDC,
        token1: ARB_USDCe,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 99163803 
    },
    {
        token0: ARB_USDC,
        token1: ARB_USDT,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 99299098  
    },
    {
        token0: ARB_USDT,
        token1: ARB_DAI,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 65190653 
    },
    {
        token0: ARB_USDC,
        token1: ARB_DAI,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 101196671  
    },
    {
        token0: ARB_USDCe,
        token1: ARB_DAI,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 65214341 
    },
    {
        token0: ARB_USDCe,
        token1: ARB_USDT,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 64173428 
    }
]