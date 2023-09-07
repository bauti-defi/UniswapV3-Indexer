import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Transaction} from "./transaction.model"
import {Pool} from "./pool.model"

@Entity_()
export class CollectionPosition {
    constructor(props?: Partial<CollectionPosition>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction

    @Index_()
    @ManyToOne_(() => Pool, {nullable: true})
    pool!: Pool

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint

    @Index_()
    @Column_("text", {nullable: true})
    recipient!: string | undefined | null

    @Index_()
    @Column_("int4", {nullable: false})
    tickLower!: number

    @Index_()
    @Column_("int4", {nullable: false})
    tickUpper!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount0Collected!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1Collected!: bigint
}
