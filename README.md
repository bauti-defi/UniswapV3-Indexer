# UniswapV3-squid

Index UniswapV3 events and transactions with Squid into a PostgreSQL.

## Usage

0. Install the [Squid CLI](https://docs.subsquid.io/squid-cli/):

```sh
npm i -g @subsquid/cli
```

1. Run npm install
  
```sh
npm install
```

2. Build and run the squid

```bash
sqd build
sqd up
sqd migration:generate
sqd process
```
The indexing will start.

In a separate window, start the GraphQL API server at `localhost:4350/graphql`:
```bash
sqd serve
```

For more details on how to build and deploy a squid, see the [docs](https://docs.subsquid.io).