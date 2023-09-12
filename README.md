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
DB_NAME=squid
DB_PORT=23798
GQL_PORT=4350
CHAIN_ID=42161 # chain to index (42161 = arbitrum)
```

3. Build and run the squid

```bash
sqd codegen # generate models folder
sqd up # start postgres container
sqd migration:generate # generate migration files
sqd process # start indexing
```

The indexing will start.

In a separate window, start the GraphQL API server at `localhost:4350/graphql`:
```bash
sqd serve
```