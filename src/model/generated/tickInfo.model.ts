import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class TickInfo {
    constructor(props?: Partial<TickInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    pool!: string

    @Index_()
    @Column_("int4", {nullable: false})
    tick!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    liquidityGross!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    liquidityNet!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    feeGrowthOutside0X128!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    feeGrowthOutside1X128!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tickCumulativeOutside!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    secondsPerLiquidityOutsideX128!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    secondsOutside!: bigint

    @Column_("bool", {nullable: false})
    initialized!: boolean
}
