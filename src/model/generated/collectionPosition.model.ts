import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Transaction} from "./transaction.model"
import {Position} from "./position.model"

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

    @Column_("int4", {nullable: false})
    logIndex!: number

    @Index_()
    @Column_("text", {nullable: true})
    recipient!: string | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount0Collected!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1Collected!: bigint

    @Index_()
    @ManyToOne_(() => Position, {nullable: true})
    position!: Position
}
