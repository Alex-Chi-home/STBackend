import { Request, Response, NextFunction, CookieOptions } from "express";
import { AuthService } from "../services/authService";

export class AuthController {
  private authService = new AuthService();
  TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      const { token, id } = await this.authService.register(
        username,
        email,
        password
      );

      const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: this.TWO_DAYS,
        path: "/",
      };

      res.cookie("jwt", token, cookieOptions);

      res.status(201).json({
        status: "success",
        data: { user: { id, username, email } },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { username, token, id } = await this.authService.login(
        email,
        password
      );

      const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: this.TWO_DAYS,
        path: "/",
      };

      res.cookie("jwt", token, cookieOptions);

      res.json({
        status: "success",
        data: { user: { id, username, email } },
      });
    } catch (error) {
      next(error);
    }
  }
}

// async logout(req: Request, res: Response) {
//   res.clearCookie("jwt", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "lax",
//     path: "/",
//   });
//   res.json({ status: "success", message: "Logged out" });
// }
