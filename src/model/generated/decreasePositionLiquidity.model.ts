import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Transaction} from "./transaction.model"
import {Position} from "./position.model"

@Entity_()
export class DecreasePositionLiquidity {
    constructor(props?: Partial<DecreasePositionLiquidity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction

    @Column_("int4", {nullable: false})
    logIndex!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    liquidityDelta!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount0!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1!: bigint

    @Index_()
    @ManyToOne_(() => Position, {nullable: true})
    position!: Position
}
