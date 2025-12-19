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

    logger.info(`Socket.IO initializing with allowed origins: ${JSON.stringify(allowedOrigins)}`);

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) {
            return callback(null, true);
          }

          if (process.env.NODE_ENV === "development") {
            return callback(null, true);
          }

          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 120000,
      pingInterval: 25000,
      allowUpgrades: true,
      upgradeTimeout: 30000,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication token missing"));
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          logger.error("JWT_SECRET is not defined!");
          return next(new Error("Server configuration error"));
        }

        const decoded = jwt.verify(token, jwtSecret) as {
          userId: number;
        };

        socket.userId = decoded.userId;
        next();
      } catch {
        next(new Error("Invalid or expired token"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      if (!userId) {
        logger.error(`Socket connected without userId! Socket: ${socket.id}`);
        socket.disconnect();
        return;
      }

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(socket.id);

      socket.join(`user:${userId}`);

      // Notify client that connection is ready and they should rejoin chats
      socket.emit("connection:ready", {
        userId,
        socketId: socket.id,
        message: "Please rejoin your chat rooms",
      });

      // Allow client to join multiple chats at once (for reconnection)
      socket.on("join:chats", (chatIds: number[]) => {
        chatIds.forEach((chatId) => {
          socket.join(`chat:${chatId}`);
        });
        socket.emit("joined:chats", { chatIds });
      });

      socket.on("join:chat", (chatId: number) => {
        socket.join(`chat:${chatId}`);

        socket.emit("joined:chat", { chatId });
      });

      socket.on("leave:chat", (chatId: number) => {
        socket.leave(`chat:${chatId}`);
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

      socket.on("error", (error) => {
        logger.error(`Socket ${socket.id} error:`, error);
      });

      socket.on("disconnect", () => {
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

  public emitNewMessage(chatId: number, message: unknown) {
    const room = `chat:${chatId}`;

    this.io.to(room).emit("message:new", message);
  }

  public emitMessageDeleted(chatId: number, messageId: number) {
    const room = `chat:${chatId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    logger.info(`Emitting message deletion to room ${room}, sockets: ${socketsInRoom?.size || 0}`);

    this.io.to(room).emit("message:deleted", { chatId, messageId });
  }

  public emitNewChat(userId: number, chat: unknown) {
    const room = `user:${userId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    logger.info(`Emitting new chat to room ${room}, sockets: ${socketsInRoom?.size || 0}`);

    this.io.to(room).emit("chat:new", chat);
  }

  public emitChatDeleted(chatId: number, userIds: number[]) {
    userIds.forEach((userId) => {
      const room = `user:${userId}`;
      const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
      logger.debug(`Emitting chat deletion to room ${room}, sockets: ${socketsInRoom?.size || 0}`);
      this.io.to(room).emit("chat:deleted", { chatId });
    });
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
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error("Socket service not initialized. Call initializeSocketService first.");
  }
  return socketService;
};
