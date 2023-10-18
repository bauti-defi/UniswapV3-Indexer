import {Store as Store_, TypeormDatabase} from '@subsquid/typeorm-store'
import { chainId } from '../utils/chain'

const name = `squid_process_${chainId()}`

export let db = new TypeormDatabase({
    isolationLevel: 'REPEATABLE READ',
    stateSchema: name,
    supportHotBlocks: true
})
export type Store = Store_
