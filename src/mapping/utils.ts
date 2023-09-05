import { computePoolAddress, FeeAmount } from "@uniswap/v3-sdk"
import { Token } from '@uniswap/sdk-core'


const uniswapFactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'


export const calculatePoolAddress = (token0: string, token1: string, fee: unknown) => {
    return computePoolAddress({
        factoryAddress: uniswapFactoryAddress,
        // the only value that MUST be correct here is the token address, rest is just spoofed data
        tokenA: new Token(1, token0, 6, 'placeholder-symbol', 'token0', false),
        tokenB: new Token(1, token1, 6, 'placeholder-symbol', 'token1', false),
        fee: fee as FeeAmount,
    })
}
