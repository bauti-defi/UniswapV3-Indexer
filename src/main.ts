import {positionManagerContract} from './mapping'
import {swapRouterContract} from './mapping'
import {processor} from './processor'
import {db, Store} from './db'
import {EntityBuffer} from './entityBuffer'
import {Block, Transaction} from './model'

processor.run(db, async (ctx) => {
    for (let block of ctx.blocks) {
        EntityBuffer.add(
            new Block({
                id: block.header.id,
                number: block.header.height,
                timestamp: new Date(block.header.timestamp),
            })
        )

        for (let log of block.logs) {
            if (log.address === '0xc36442b4a4522e871399cd717abdd847ab11fe88') {
                positionManagerContract.parseEvent(ctx, log)
            }
        }

        for (let transaction of block.transactions) {
            if (transaction.to === '0xc36442b4a4522e871399cd717abdd847ab11fe88') {
                positionManagerContract.parseFunction(ctx, transaction)
            }else if(transaction.to === '0xe592427a0aece92de3edee1f18e0157c05861564'){
                swapRouterContract.parseFunction(ctx, transaction)
            }

            EntityBuffer.add(
                new Transaction({
                    id: transaction.id,
                    blockNumber: block.header.height,
                    blockTimestamp: new Date(block.header.timestamp),
                    hash: transaction.hash,
                    to: transaction.to,
                    from: transaction.from,
                    status: transaction.status,
                })
            )
        }
    }

    for (let entities of EntityBuffer.flush()) {
        await ctx.store.insert(entities)
    }
})
