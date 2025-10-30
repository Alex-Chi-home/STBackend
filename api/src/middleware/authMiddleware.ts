import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../types";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check Authorization header first
  let token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if(!token && req.headers.authorization?.startsWith("jwt=")){
    token = req.headers.authorization.split("jwt=")[1]
  }
  // Fallback to cookie
  if (!token && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    throw new AppError("Authorization token missing", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }
};
