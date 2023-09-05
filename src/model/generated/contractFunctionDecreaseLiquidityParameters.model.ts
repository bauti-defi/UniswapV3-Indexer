import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class ContractFunctionDecreaseLiquidityParameters {
    constructor(props?: Partial<ContractFunctionDecreaseLiquidityParameters>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    liquidity!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount0Min!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount1Min!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    deadline!: bigint
}
