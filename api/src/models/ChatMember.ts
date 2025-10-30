import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";

@Entity("chat_members")
export class ChatMember {
  @PrimaryColumn()
  chat_id!: number;

  @PrimaryColumn()
  user_id!: number;

  @ManyToOne(() => Chat, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id" })
  chat!: Chat;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @CreateDateColumn()
  joined_at!: Date;

  @Column({ type: "enum", enum: ["member", "admin"], default: "member" })
  role!: "member" | "admin";
}
