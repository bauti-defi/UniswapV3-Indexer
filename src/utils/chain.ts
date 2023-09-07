export const chainId = (): number => {
    const id = process.env.CHAIN_ID
    if(!id) throw new Error(`CHAIN_ID env variable not set`)

    return parseInt(id)
}
