import { AppDataSource } from "../config/database";
import { UserRelationship } from "../models/UserRelationship";
import { AppError } from "../types";

export class RelationshipService {
  async addRelationship(
    userId: number,
    relatedUserId: number,
    type: "friend" | "follower" | "blocked"
  ) {
    const relationshipRepository =
      AppDataSource.getRepository(UserRelationship);

    if (userId === relatedUserId) {
      throw new AppError("Cannot add relationship with self", 400);
    }

    const existing = await relationshipRepository.findOne({
      where: { user_id: userId, related_user_id: relatedUserId },
    });
    if (existing) {
      throw new AppError("Relationship already exists", 400);
    }

    const relationship = relationshipRepository.create({
      user_id: userId,
      related_user_id: relatedUserId,
      relationship_type: type,
    });
    await relationshipRepository.save(relationship);

    return relationship;
  }

  async getRelationships(userId: number) {
    const relationshipRepository =
      AppDataSource.getRepository(UserRelationship);
    return relationshipRepository.find({
      where: { user_id: userId },
      relations: ["related_user"],
    });
  }
}
