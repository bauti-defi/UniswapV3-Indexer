import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class ContractFunctionExactInputSingleParams {
    constructor(props?: Partial<ContractFunctionExactInputSingleParams>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    pool!: string

    @Index_()
    @Column_("text", {nullable: false})
    tokenIn!: string

    @Index_()
    @Column_("text", {nullable: false})
    tokenOut!: string

    @Index_()
    @Column_("int4", {nullable: false})
    fee!: number

    @Index_()
    @Column_("text", {nullable: true})
    recipient!: string | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    deadline!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amountIn!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amountOutMinimum!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    sqrtPriceLimitX96!: bigint
}
