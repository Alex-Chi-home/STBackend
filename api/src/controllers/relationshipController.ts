import { Request, Response } from "express";
import { RelationshipService } from "../services/relationshipService";

export class RelationshipController {
  private relationshipService = new RelationshipService();

  async addRelationship(req: Request, res: Response) {
    const { relatedUserId, type } = req.body;
    const relationship = await this.relationshipService.addRelationship(
      req.user!.id,
      relatedUserId,
      type
    );
    res.status(201).json({ status: "success", data: relationship });
  }

  async getRelationships(req: Request, res: Response) {
    const relationships = await this.relationshipService.getRelationships(
      req.user!.id
    );
    res.json({ status: "success", data: relationships });
  }
}
