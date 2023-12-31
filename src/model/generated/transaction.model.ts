import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Block} from "./block.model"
import {Swap} from "./swap.model"
import {MintPosition} from "./mintPosition.model"
import {DecreasePositionLiquidity} from "./decreasePositionLiquidity.model"
import {CollectionPosition} from "./collectionPosition.model"
import {IncreasePositionLiquidity} from "./increasePositionLiquidity.model"
import {BurnPosition} from "./burnPosition.model"
import {PositionTransfer} from "./positionTransfer.model"

@Index_(["block", "hash"], {unique: true})
@Entity_()
export class Transaction {
    constructor(props?: Partial<Transaction>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @ManyToOne_(() => Block, {nullable: true})
    block!: Block

    @Column_("int4", {nullable: false})
    transactionIndex!: number

    @Index_()
    @Column_("text", {nullable: false})
    hash!: string

    @Index_()
    @Column_("text", {nullable: true})
    trxTo!: string | undefined | null

    @Column_("bool", {nullable: false})
    toContract!: boolean

    @Index_()
    @Column_("text", {nullable: true})
    trxFrom!: string | undefined | null

    @Index_()
    @Column_("int4", {nullable: true})
    status!: number | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    gasUsed!: bigint

    @OneToMany_(() => Swap, e => e.transaction)
    swaps!: Swap[]

    @OneToMany_(() => MintPosition, e => e.transaction)
    mintPositions!: MintPosition[]

    @OneToMany_(() => DecreasePositionLiquidity, e => e.transaction)
    decreasePositionLiquidity!: DecreasePositionLiquidity[]

    @OneToMany_(() => CollectionPosition, e => e.transaction)
    collectPositions!: CollectionPosition[]

    @OneToMany_(() => IncreasePositionLiquidity, e => e.transaction)
    increasePositionLiquidity!: IncreasePositionLiquidity[]

    @OneToMany_(() => BurnPosition, e => e.transaction)
    burnPositions!: BurnPosition[]

    @OneToMany_(() => PositionTransfer, e => e.transaction)
    positionTransfers!: PositionTransfer[]
}
