import { FeeAmount, computePoolAddress } from "@uniswap/v3-sdk"
import { Token } from '@uniswap/sdk-core'
import { chainId } from "../utils/chain"
import { ARBI_POOLS_OF_INTEREST } from "./arbitrum"
import { Pool } from "./types"
import { ETH_POOLS_OF_INTEREST } from "./ethereum"

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

export const getPoolOfInterestFromAddress = (address: string): Pool => {
    const pool = poolsOfInterest().find(p => calculatePoolAddress(p.token0, p.token1, p.fee).toLowerCase() === address.toLowerCase())
    if (!pool) {
        throw new Error(`Pool not found for address ${address}`)
    }
    return pool
}

export const poolsOfInterest = (): readonly Pool[] => {
    switch(chainId()) {
        case 1: return ETH_POOLS_OF_INTEREST
        case 42161: return ARBI_POOLS_OF_INTEREST
        default: throw new Error(`No pools of interest for chainId ${chainId()}`)
    }
}

export const poolAddressesOfInterest = poolsOfInterest().map(pool => calculatePoolAddress(pool.token0, pool.token1, pool.fee))

export const isPoolAddressOfInterest = (address: string) => poolAddressesOfInterest.map(p => p.toLowerCase()).includes(address.toLowerCase());

// we export just to make sure we override with the correct values
export * from "./arbitrum"
export * from "./ethereum"
export * from "./persistence"
export * from "./types"