import { DataHandlerContext } from "@subsquid/evm-processor";
import { Position } from "../model";
import { Store } from "@subsquid/typeorm-store";


const positionCache: Record<string, Position> = {}

export async function getPositionByTokenIdThunk({
    tokenId,
    chainId,
    ctx
}:{
    tokenId: bigint, 
    chainId: number,  
    ctx: DataHandlerContext<Store>
}): Promise<Position | undefined> {
    const key = `${tokenId}-${chainId}`
    if(positionCache[key]) return positionCache[key]

    const position = await ctx.store.findOneBy(Position, {tokenId, chainId})

    if(!position) return undefined

    positionCache[key] = position

    return position
}