import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk"
import { Token } from '@uniswap/sdk-core'
import { Store } from "./db"
import { DataHandlerContext } from "@subsquid/evm-processor"
import { Pool as PoolModel} from "./model"
import { utils } from 'web3'

const uniswapFactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'


export const calculatePoolAddress = (token0: string, token1: string, fee: FeeAmount) => {
    return computePoolAddress({
        factoryAddress: uniswapFactoryAddress,
        // the only value that MUST be correct here is the token address, rest is just spoofed data
        tokenA: new Token(1, token0, 6, 'placeholder-symbol', 'token0', false),
        tokenB: new Token(1, token1, 6, 'placeholder-symbol', 'token1', false),
        fee,
    })
}

type Pool = {
    token0: string
    token1: string
    fee: FeeAmount
}

const ARB_USDCe = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as const
const ARB_USDT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as const
const ARB_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const
const ARB_DAI = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as const

const poolsOfInterest: readonly Pool[] = [
    {
        token0: ARB_USDC,
        token1: ARB_USDCe,
        fee: FeeAmount.LOWEST
    },
    {
        token0: ARB_USDC,
        token1: ARB_USDT,
        fee: FeeAmount.LOWEST
    },
    {
        token0: ARB_USDT,
        token1: ARB_DAI,
        fee: FeeAmount.LOWEST
    },
    {
        token0: ARB_USDC,
        token1: ARB_DAI,
        fee: FeeAmount.LOWEST
    },
    {
        token0: ARB_USDCe,
        token1: ARB_DAI,
        fee: FeeAmount.LOWEST
    },
    {
        token0: ARB_USDCe,
        token1: ARB_USDT,
        fee: FeeAmount.LOWEST
    }
]

const poolModelCache: PoolModel[] = []

export const getPool = async (address: string, ctx: DataHandlerContext<Store>) => {
    let pool = poolModelCache.find(p => p.poolAddress.toLowerCase() === address.toLowerCase())

    if(pool) return pool

    pool = await ctx.store.findOneBy(PoolModel, {poolAddress: utils.toChecksumAddress(address)})

    if(pool) {
        poolModelCache.push(pool)
        return pool
    }

    throw new Error(`Pool not found in database for address ${address}`)
}

export const poolAddresses = poolsOfInterest.map(pool => calculatePoolAddress(pool.token0, pool.token1, pool.fee))

export const isPoolAddressOfInterest = (address: string) => poolAddresses.map(p => p.toLowerCase()).includes(address.toLowerCase());

export const getPoolFromAddress = (address: string): Pool => {
    const pool = poolsOfInterest.find(p => calculatePoolAddress(p.token0, p.token1, p.fee).toLowerCase() === address.toLowerCase())
    if (!pool) {
        throw new Error(`Pool not found for address ${address}`)
    }
    return pool
}

export const populatePoolsTable = async (ctx: DataHandlerContext<Store>) => {
    const pools = poolsOfInterest.map((pool, i) => new PoolModel({
        id: calculatePoolAddress(pool.token0, pool.token1, pool.fee),
        chainId: 42161, // arbitrum
        token0: pool.token0,
        token1: pool.token1,
        fee: pool.fee,
        poolAddress: calculatePoolAddress(pool.token0, pool.token1, pool.fee)
    }))

    await ctx.store.save(pools) // upsert
}