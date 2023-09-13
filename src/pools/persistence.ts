import { DataHandlerContext } from "@subsquid/evm-processor"
import { Store } from "@subsquid/typeorm-store"
import { FeeAmount } from "@uniswap/v3-sdk"
import { utils } from "web3"
import { v4 as uuidv4 } from 'uuid';
import { calculatePoolAddress } from "."
import { chainId } from "../utils/chain"
import { Pool as PoolModel} from "../model"
import { Pool } from "./types";

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


export const populatePoolsTable = async (ctx: DataHandlerContext<Store>, pools: readonly Pool[]) => {
    const models = pools.map((pool) => new PoolModel({
        id: uuidv4(),
        chainId: chainId(), 
        token0: pool.token0,
        token1: pool.token1,
        fee: pool.fee,
        poolAddress: calculatePoolAddress(pool.token0, pool.token1, pool.fee)
    }))


    await Promise.all(models.map(async p => {
        const existing = await ctx.store.findOneBy(PoolModel, {poolAddress: p.poolAddress, chainId: p.chainId})

        if(!existing) return ctx.store.insert(p)
    }))
}
