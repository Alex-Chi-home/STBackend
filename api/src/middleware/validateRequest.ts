import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../types";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(
      errors
        .array()
        .map((e) => e.msg)
        .join(", "),
      400
    );
  }
  next();
};
