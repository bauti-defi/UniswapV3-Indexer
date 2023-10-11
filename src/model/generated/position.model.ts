import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Pool} from "./pool.model"
import {MintPosition} from "./mintPosition.model"
import {DecreasePositionLiquidity} from "./decreasePositionLiquidity.model"
import {IncreasePositionLiquidity} from "./increasePositionLiquidity.model"
import {CollectionPosition} from "./collectionPosition.model"
import {BurnPosition} from "./burnPosition.model"
import {PositionTransfer} from "./positionTransfer.model"

@Index_(["chainId", "tokenId"], {unique: true})
@Entity_()
export class Position {
    constructor(props?: Partial<Position>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Pool, {nullable: true})
    pool!: Pool

    @Column_("int4", {nullable: false})
    chainId!: number

    @Index_()
    @Column_("int4", {nullable: false})
    tickLower!: number

    @Index_()
    @Column_("int4", {nullable: false})
    tickUpper!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint


    @OneToMany_(() => DecreasePositionLiquidity, e => e.position)
    decreaseLiquidity!: DecreasePositionLiquidity[]

    @OneToMany_(() => IncreasePositionLiquidity, e => e.position)
    increaseLiquidity!: IncreasePositionLiquidity[]

    @OneToMany_(() => CollectionPosition, e => e.position)
    collects!: CollectionPosition[]


    @OneToMany_(() => PositionTransfer, e => e.position)
    transfers!: PositionTransfer[]
}
