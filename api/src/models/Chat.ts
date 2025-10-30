import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

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

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  created_by!: User;
}
