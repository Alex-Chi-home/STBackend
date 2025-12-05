import { NextFunction, Request, Response } from "express";
import { UsersService } from "../services/usersService";
import { AppError } from "../types";

export class UsersController {
  private usersService = new UsersService();

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.usersService.getUsers(req.user!.id);
      if (!user) {
        throw new AppError("User not found", 403);
      }
      res.json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  }
}
