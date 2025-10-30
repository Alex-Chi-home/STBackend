import { Router, Request, Response, NextFunction } from "express";
import { check } from "express-validator";
import { MessageController } from "../controllers/messageController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();
const messageController = new MessageController();

router.post(
  "/",
  authMiddleware,
  [
    check("chatId").isInt().withMessage("Valid chat ID is required"),
    check("content").notEmpty().withMessage("Message content is required"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    messageController.sendMessage(req, res, next)
);

router.delete(
  "/",
  authMiddleware,
  [
    check("chatId").isInt().withMessage("Valid chat ID is required"),
    check("id").isInt().withMessage("Valid message ID is required"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    messageController.deleteMessage(req, res, next)
);

router.get(
  "/:chatId",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    messageController.getChatMessages(req, res, next)
);

export default router;
