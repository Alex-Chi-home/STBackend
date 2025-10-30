import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from "typeorm";
import { Message } from "./Message";
import { User } from "./User";

@Entity("message_status")
export class MessageStatus {
  @PrimaryColumn()
  message_id!: number;

  @PrimaryColumn()
  user_id!: number;

  @ManyToOne(() => Message, { onDelete: "CASCADE" })
  @JoinColumn({ name: "message_id" })
  message!: Message;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({
    type: "enum",
    enum: ["sent", "delivered", "read", "deleted"],
    default: "sent",
  })
  status!: "sent" | "delivered" | "read" | "deleted";

  @UpdateDateColumn()
  updated_at!: Date;
}
