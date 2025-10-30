import { Router, Request, Response, NextFunction } from "express";
import { check } from "express-validator";
import { ChatController } from "../controllers/chatController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();
const chatController = new ChatController();

router.post(
  "/private",
  authMiddleware,
  [
    check("otherUserId").isInt().withMessage("Valid user ID is required"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    chatController.createPrivateChat(req, res, next)
);

router.post(
  "/group",
  authMiddleware,
  [
    check("name").notEmpty().withMessage("Group name is required"),
    check("memberIds").isArray().withMessage("Member IDs must be an array"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    chatController.createGroupChat(req, res, next)
);

router.get("/", authMiddleware, (req: Request, res: Response) =>
  chatController.getUserChats(req, res)
);

router.delete(
  "/:id",
  authMiddleware,
  [
    check("id").isInt().withMessage("Valid chat ID is required"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    chatController.deleteChat(req, res, next)
);

export default router;
