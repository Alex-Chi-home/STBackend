import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/userService";
import { AppError } from "../types";

export class UserController {
  private userService = new UserService();

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.getUser(req.user!.id);
      if (!user) {
        throw new AppError("User not found", 403);
      }
      res.json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  }
}
