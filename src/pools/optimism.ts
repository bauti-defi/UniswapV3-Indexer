import { FeeAmount } from "@uniswap/v3-sdk"
import { Pool } from "./types"

const OP_USDCe = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607' as const
const OP_USDT = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' as const
const OP_USDC = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as const
const OP_DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as const

// pulled manually from arbiscan
export const OP_POOLS_OF_INTEREST: readonly Pool[] = [
    {
        token0: OP_USDC,
        token1: OP_USDT,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 80172295  
    },
    {
        token0: OP_USDT,
        token1: OP_DAI,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 16840184 
    },
    {
        token0: OP_USDC,
        token1: OP_DAI,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 70710078  
    },
    {
        token0: OP_USDCe,
        token1: OP_DAI,
        fee: FeeAmount.LOWEST,
        deployedAtBlock: 109169657 
    },
]