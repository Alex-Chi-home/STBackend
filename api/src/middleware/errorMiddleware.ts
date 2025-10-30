import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";
import logger from "../config/logger";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
