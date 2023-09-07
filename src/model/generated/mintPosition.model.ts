import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_, JoinColumn as JoinColumn_} from "typeorm"
import * as marshal from "./marshal"
import {Transaction} from "./transaction.model"
import {Position} from "./position.model"

@Entity_()
export class MintPosition {
    constructor(props?: Partial<MintPosition>) {
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
    amount0!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    liquidity!: bigint

    @Index_()
    @Column_("text", {nullable: true})
    recipient!: string | undefined | null

    @Index_({unique: true})
    @OneToOne_(() => Position, {nullable: true})
    @JoinColumn_()
    position!: Position
}
