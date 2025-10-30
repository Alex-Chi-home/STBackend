import { Router, Request, Response, NextFunction } from "express";
import { check } from "express-validator";
import { AuthController } from "../controllers/authController";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();
const authController = new AuthController();

router.post(
  "/register",
  [
    check("username").notEmpty().withMessage("Username is required"),
    check("email").isEmail().withMessage("Valid email is required"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    authController.register(req, res, next)
);

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  (req: Request, res: Response, next: NextFunction) =>
    authController.login(req, res, next)
);

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
