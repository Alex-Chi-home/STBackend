import { Router, Request, Response } from "express";
import { check } from "express-validator";
import { RelationshipController } from "../controllers/relationshipController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();
const relationshipController = new RelationshipController();

router.post(
  "/",
  authMiddleware,
  [
    check("relatedUserId").isInt().withMessage("Valid user ID is required"),
    check("type")
      .isIn(["friend", "follower", "blocked"])
      .withMessage("Invalid relationship type"),
    validateRequest,
  ],
  (req: Request, res: Response) =>
    relationshipController.addRelationship(req, res)
);

router.get("/", authMiddleware, (req: Request, res: Response) =>
  relationshipController.getRelationships(req, res)
);

export default router;
