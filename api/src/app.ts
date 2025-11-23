import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import { errorMiddleware } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import usersRoutes from "./routes/usersRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import relationshipRoutes from "./routes/relationshipRoutes";
import logger from "./config/logger";
import { AppError } from "./types";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.NGROK_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://simple-telegram-peach.vercel.app",
].filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    console.log("🔍 CORS Check - Origin:", origin);
    console.log("🔍 Allowed origins:", allowedOrigins);

    if (!origin) {
      console.log("✅ No origin (same-site request)");
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("✅ ORIGIN ALLOWED +");
      callback(null, true);
      return;
    }
    console.log("❌ ORIGIN NOT ALLOWED --");
    logger.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"],
  maxAge: 86400,
};

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Handle preflight requests with same CORS config
app.options("*", cors(corsOptions));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);
app.use((req, res, next) => {
  if (req.originalUrl !== "/api/auth/health") {
    logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  }
  next();
});

console.log("test changed", process.env.NODE_ENV);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/relationships", relationshipRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});
app.use(errorMiddleware);

export default app;
