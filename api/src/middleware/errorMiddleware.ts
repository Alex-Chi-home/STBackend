import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";
import logger from "../config/logger";

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.NGROK_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://simple-telegram-peach.vercel.app",
].filter(Boolean);

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add CORS headers to error responses
  const origin = req.get("origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (err instanceof AppError) {
    logger.error(
      `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  } else {
    logger.error(
      `500 - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
  next();
};
