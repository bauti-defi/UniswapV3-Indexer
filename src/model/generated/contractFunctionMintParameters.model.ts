import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class ContractFunctionMintParameters {
    constructor(props?: Partial<ContractFunctionMintParameters>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    token0!: string

    @Index_()
    @Column_("text", {nullable: false})
    token1!: string

    @Index_()
    @Column_("int4", {nullable: false})
    fee!: number

    @Column_("int4", {nullable: false})
    tickLower!: number

    @Column_("int4", {nullable: false})
    tickUpper!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount0Desired!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1Desired!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount0Min!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1Min!: bigint

    @Index_()
    @Column_("text", {nullable: true})
    recipient!: string | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    deadline!: bigint
}
