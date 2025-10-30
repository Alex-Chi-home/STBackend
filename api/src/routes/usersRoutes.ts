import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { UsersController } from "../controllers/usersController";

const router = Router();
const userController = new UsersController();

router.get(
  "/",
  authMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsers(req, res, next)
);

export default router;
