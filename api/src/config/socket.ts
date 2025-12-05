import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./logger";

export interface AuthenticatedSocket extends Socket {
  userId?: number;
}

export class SocketService {
  private io: Server;
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.NGROK_URL,
      "http://localhost:3000",
      "http://localhost:5173",
    ].filter(Boolean);

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);

          if (process.env.NODE_ENV === "development") {
            return callback(null, true);
          }

          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          logger.warn(`Socket.IO CORS blocked request from origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // JWT Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          logger.warn("Socket connection attempt without token");
          return next(new Error("Authentication token missing"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: number;
        };

        socket.userId = decoded.userId;
        logger.info(`Socket authenticated for user ${decoded.userId}`);
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        next(new Error("Invalid or expired token"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(`User ${userId} connected with socket ${socket.id}`);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);

      socket.on("join:chat", (chatId: number) => {
        socket.join(`chat:${chatId}`);
        logger.info(`User ${userId} joined chat ${chatId}`);
        socket.emit("joined:chat", { chatId });
      });

      socket.on("leave:chat", (chatId: number) => {
        socket.leave(`chat:${chatId}`);
        logger.info(`User ${userId} left chat ${chatId}`);
        socket.emit("left:chat", { chatId });
      });

      socket.on("typing:start", (data: { chatId: number }) => {
        socket.to(`chat:${data.chatId}`).emit("user:typing", {
          userId,
          chatId: data.chatId,
        });
      });

      socket.on("typing:stop", (data: { chatId: number }) => {
        socket.to(`chat:${data.chatId}`).emit("user:stopped-typing", {
          userId,
          chatId: data.chatId,
        });
      });

      socket.on("message:read", (data: { messageId: number; chatId: number }) => {
        socket.to(`chat:${data.chatId}`).emit("message:read-status", {
          messageId: data.messageId,
          userId,
          status: "read",
        });
      });

      socket.on("disconnect", () => {
        logger.info(`User ${userId} disconnected socket ${socket.id}`);
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });
  }

  public emitNewMessage(chatId: number, message: any) {
    this.io.to(`chat:${chatId}`).emit("message:new", message);
    logger.info(`Emitted new message to chat ${chatId}`);
  }

  public emitMessageDeleted(chatId: number, messageId: number) {
    this.io.to(`chat:${chatId}`).emit("message:deleted", { chatId, messageId });
    logger.info(`Emitted message deletion to chat ${chatId}`);
  }

  public emitNewChat(userId: number, chat: any) {
    this.io.to(`user:${userId}`).emit("chat:new", chat);
    logger.info(`Emitted new chat to user ${userId}`);
  }

  public emitChatDeleted(chatId: number, userIds: number[]) {
    userIds.forEach((userId) => {
      this.io.to(`user:${userId}`).emit("chat:deleted", { chatId });
    });
    logger.info(`Emitted chat deletion to users`);
  }

  public getIO(): Server {
    return this.io;
  }

  public isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}

let socketService: SocketService | null = null;

export const initializeSocketService = (httpServer: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(httpServer);
    logger.info("Socket.IO service initialized");
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error("Socket service not initialized. Call initializeSocketService first.");
  }
  return socketService;
};
