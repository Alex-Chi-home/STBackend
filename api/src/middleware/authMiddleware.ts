import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../types";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🔐 Auth Middleware Check:");
  console.log("  URL:", req.originalUrl);
  console.log(
    "  Authorization header:",
    req.headers.authorization ? "✅ Present" : "❌ Missing"
  );
  console.log(
    "  Cookies:",
    Object.keys(req.cookies).length > 0
      ? `✅ ${Object.keys(req.cookies).join(", ")}`
      : "❌ No cookies"
  );
  console.log("  Cookie jwt:", req.cookies.jwt ? "✅ Present" : "❌ Missing");

  // Check Authorization header first
  let token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token && req.headers.authorization?.startsWith("jwt=")) {
    token = req.headers.authorization.split("jwt=")[1];
  }
  // Fallback to cookie
  if (!token && req.cookies.jwt) {
    console.log("  ✅ Using token from cookie");
    token = req.cookies.jwt;
  }

  if (!token) {
    console.log("🔴 No token found!");
    console.log("  Full headers:", JSON.stringify(req.headers, null, 2));
    console.log("  Full cookies:", JSON.stringify(req.cookies, null, 2));
    throw new AppError("Authorization token missing", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    req.user = { id: decoded.userId };
    console.log("  ✅ Token verified for user:", decoded.userId);
    next();
  } catch (err) {
    console.log("  ❌ Token verification failed:", err);
    throw new AppError("Invalid or expired token", 401);
  }
};
