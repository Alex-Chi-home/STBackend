import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { UserController } from "../controllers/userController";

const router = Router();
const userController = new UserController();

router.get(
  "/",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUser(req, res, next)
);

export default router;
