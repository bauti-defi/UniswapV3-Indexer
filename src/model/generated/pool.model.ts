import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"

@Entity_()
export class Pool {
    constructor(props?: Partial<Pool>) {
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

    @Index_()
    @Column_("text", {nullable: false})
    poolAddress!: string
}
