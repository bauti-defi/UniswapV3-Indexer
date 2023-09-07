import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToOne as OneToOne_, JoinColumn as JoinColumn_} from "typeorm"
import {Transaction} from "./transaction.model"
import {Position} from "./position.model"

@Entity_()
export class BurnPosition {
    constructor(props?: Partial<BurnPosition>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => Transaction, {nullable: true})
    transaction!: Transaction

    @Column_("int4", {nullable: false})
    transactionIndex!: number

    @Index_({unique: true})
    @OneToOne_(() => Position, {nullable: true})
    @JoinColumn_()
    position!: Position
}
