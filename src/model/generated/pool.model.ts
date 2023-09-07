import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {Swap} from "./swap.model"
import {Position} from "./position.model"

@Index_(["chainId", "poolAddress"], {unique: true})
@Entity_()
export class Pool {
    constructor(props?: Partial<Pool>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    chainId!: number

    @Index_()
    @Column_("text", {nullable: false})
    token0!: string

    @Index_()
    @Column_("text", {nullable: false})
    token1!: string

    @Index_()
    @Column_("int4", {nullable: false})
    fee!: number

    @Column_("text", {nullable: false})
    poolAddress!: string

    @OneToMany_(() => Swap, e => e.pool)
    swaps!: Swap[]

    @OneToMany_(() => Position, e => e.pool)
    positions!: Position[]
}
