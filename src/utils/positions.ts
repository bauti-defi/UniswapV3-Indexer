import { DataHandlerContext } from "@subsquid/evm-processor";
import { Position } from "../model";
import { Store } from "@subsquid/typeorm-store";


const positionCache: Record<string, Position> = {}
const positionIgnoreList: Record<string, boolean> = {}

const positionKey = ({tokenId, chainId}:{tokenId: bigint, chainId: number}): string => `${tokenId}-${chainId}`

export async function populatePositionCache({
    chainId,
    ctx
}:{
    chainId: number, 
    ctx: DataHandlerContext<Store>
}): Promise<void> {
    const positions = await ctx.store.findBy(Position, {chainId})

    for(let position of positions) {
        positionCache[positionKey(position)] = position
    }

    ctx.log.info(`Populated position cache with ${positions.length} positions`)
}

export async function getPositionByTokenIdThunk({
    tokenId,
    chainId,
    ctx
}:{
    tokenId: bigint, 
    chainId: number,  
    ctx: DataHandlerContext<Store>
}): Promise<Position | undefined> {
    const key = positionKey({tokenId, chainId})

    let position: Position | undefined = positionCache[key]

    if(position) {
        // ctx.log.info(`Found in cache: ${key}`)
        return position
    } else if(positionIgnoreList[key]) return undefined;

    position = await ctx.store.findOneBy(Position, {tokenId, chainId})

    if(!position) {
        // ctx.log.info(`Ignoring position: ${key}`)

        // ! @dev: we don't want to keep querying the database for positions that are not
        // of interest (e.g. not from the pools of interest)
        positionIgnoreList[key] = true
        return undefined
    }

    positionCache[key] = position
    // ctx.log.info(`Added to cache: ${key}`)

    return position
}