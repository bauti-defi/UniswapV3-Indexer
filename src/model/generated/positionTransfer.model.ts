import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Transaction} from "./transaction.model"
import {Position} from "./position.model"

@Entity_()
export class PositionTransfer {
    constructor(props?: Partial<PositionTransfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction

    @Column_("int4", {nullable: false})
    logIndex!: number

    @Index_()
    @Column_("text", {nullable: true})
    transferFrom!: string | undefined | null

    @Index_()
    @Column_("text", {nullable: true})
    transferTo!: string | undefined | null

    @Index_()
    @ManyToOne_(() => Position, {nullable: true})
    position!: Position
}
