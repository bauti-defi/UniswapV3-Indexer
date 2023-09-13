import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk"
import { Token } from '@uniswap/sdk-core'
import { Store } from "../db"
import { DataHandlerContext } from "@subsquid/evm-processor"
import { Pool as PoolModel} from "../model"
import { utils } from 'web3'
import { v4 as uuidv4 } from 'uuid';
import { chainId } from "./chain"


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

export type Pool = {
    token0: string
    token1: string
    fee: FeeAmount
    deployedAtBlock: number
}

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F' as const

// pulled manually from arbiscan
export const poolsOfInterest: readonly Pool[] = [
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

const poolModelCache: PoolModel[] = []

export const getPoolByAddressThunk = async (address: string, ctx: DataHandlerContext<Store>): Promise<PoolModel | undefined> => {
    let pool = poolModelCache.find(p => p.poolAddress.toLowerCase() === address.toLowerCase())

    if(pool) return pool

    pool = await ctx.store.findOneBy(PoolModel, {poolAddress: utils.toChecksumAddress(address), chainId: chainId()})

    if(pool) {
        poolModelCache.push(pool)
        return pool
    }
}

export const getPoolThunk = async (token0: string, token1: string, fee: number, ctx: DataHandlerContext<Store>) => {
    const poolAddress = calculatePoolAddress(token0, token1, fee as FeeAmount)
    return getPoolByAddressThunk(poolAddress, ctx)
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
        id: uuidv4(),
        chainId: chainId(), 
        token0: pool.token0,
        token1: pool.token1,
        fee: pool.fee,
        poolAddress: calculatePoolAddress(pool.token0, pool.token1, pool.fee)
    }))


    await Promise.all(pools.map(async p => {
        const existing = await ctx.store.findOneBy(PoolModel, {poolAddress: p.poolAddress, chainId: p.chainId})

        if(!existing) return ctx.store.insert(p)
    }))
}