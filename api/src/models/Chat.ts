import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { ChatMember } from "./ChatMember";

@Entity("chats")
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: ["private", "group"] })
  chat_type!: "private" | "group";

  @Column({ type: "varchar", length: 100, nullable: true })
  name!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL", eager: false })
  @JoinColumn({ name: "created_by_id" })
  created_by!: User;

  @OneToMany(() => ChatMember, (chatMember) => chatMember.chat)
  chatMembers!: ChatMember[];
}
