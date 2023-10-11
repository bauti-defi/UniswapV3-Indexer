# UniswapV3-Indexer

Index UniswapV3 events and transactions with Squid. Data is fetched from an external archive node and stored in a dockerized PostgreSQL. Table schemas are generated automatically from the GraphQL schema. A GraphQL API server can be optioinally started to query the data.

> For more details on how to build and deploy a squid, see the [docs](https://docs.subsquid.io).

## Supported Features
- Track positions
    - Mints
    - Increase liquidity
    - Decrease liquidity
    - Collects
    - Burns
    - Transfers
- Track swaps
- Track pools
- Track new pool creations

> Currently hardcoded to track only arbitrum stablecoin pair pools. Easy to change.

## Usage

0. Install the [Squid CLI](https://docs.subsquid.io/squid-cli/):

```sh
# ! install globally
npm i -g @subsquid/cli
```

1. Install dependencies with NPM. **Squid does NOT support yarn.**
  
```sh
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```sh
DB_NAME=uniswap-squid
DB_PORT=23798
GQL_PORT=4350
ARB_RPC_ENDPOINT=
ETH_RPC_ENDPOINT=
```

> Caveat: Use a different DB_NAME for each squid. This also applies to using the same squid on different networks.
> You will also need to update the DB_NAME inside of docker-compose.yml

3. Build and run the squid

```bash
sqd codegen # generate models folder
sqd up # start postgres container
sqd migration:generate # generate migration files

# index ethereum
sqd process:eth

# or index arbitrum
sqd process:arb
```

The indexing will start.

In a separate window, start the GraphQL API server at `localhost:4350/graphql`:
```bash
sqd serve
```