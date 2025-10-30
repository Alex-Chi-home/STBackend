import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("user_relationships")
export class UserRelationship {
  @PrimaryColumn()
  user_id!: number;

  @PrimaryColumn()
  related_user_id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "related_user_id" })
  related_user!: User;

  @Column({ type: "enum", enum: ["friend", "follower", "blocked"] })
  relationship_type!: "friend" | "follower" | "blocked";

  @CreateDateColumn()
  created_at!: Date;
}
