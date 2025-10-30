import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  chat_id!: number;

  @Column()
  sender_id!: number;

  @Column("text")
  content!: string;

  @CreateDateColumn()
  sent_at!: Date;

  @UpdateDateColumn({ nullable: true })
  edited_at!: Date | null;

  @Column({ default: false })
  is_deleted!: boolean;

  @ManyToOne(() => Chat, { onDelete: "CASCADE" })
  chat!: Chat;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender!: User;
}
