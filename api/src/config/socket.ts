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
    logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          logger.debug(`Socket.IO CORS check - origin: ${origin || "no-origin"}`);

          if (!origin) {
            logger.debug("Socket.IO CORS: No origin, allowing");
            return callback(null, true);
          }

          if (process.env.NODE_ENV === "development") {
            logger.debug(`Socket.IO CORS: Development mode, allowing origin: ${origin}`);
            return callback(null, true);
          }

          if (allowedOrigins.includes(origin)) {
            logger.debug(`Socket.IO CORS: Origin allowed: ${origin}`);
            return callback(null, true);
          }

          logger.warn(`Socket.IO CORS blocked request from origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      // Increased timeouts to handle unstable connections
      pingTimeout: 120000, // 2 minutes (was 60s)
      pingInterval: 25000,
      // Allow upgrades and handle reconnection better
      allowUpgrades: true,
      upgradeTimeout: 30000,
      // Connection state recovery (Socket.IO 4.6+)
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupDebugListeners();
  }

  private setupMiddleware() {
    // JWT Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const clientInfo = {
        id: socket.id,
        address: socket.handshake.address,
        origin: socket.handshake.headers.origin,
        transport: socket.conn?.transport?.name,
        query: socket.handshake.query,
      };
      logger.info(`Socket connection attempt: ${JSON.stringify(clientInfo)}`);

      try {
        const token =
          socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        logger.debug(
          `Token present: ${!!token}, from auth: ${!!socket.handshake.auth.token}, from header: ${!!socket.handshake.headers.authorization}`
        );

        if (!token) {
          logger.warn(`Socket connection rejected - no token. Socket: ${socket.id}`);
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
        logger.info(`Socket authenticated for user ${decoded.userId}, socket: ${socket.id}`);
        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          logger.warn(
            `Socket auth failed - token EXPIRED for ${socket.id}. Expired at: ${error.expiredAt}`
          );
        } else if (error instanceof jwt.JsonWebTokenError) {
          logger.warn(
            `Socket auth failed - INVALID token for ${socket.id}. Error: ${error.message}`
          );
        } else {
          logger.error(`Socket authentication error for ${socket.id}:`, error);
        }
        next(new Error("Invalid or expired token"));
      }
    });
  }

  private setupDebugListeners() {
    this.io.engine.on("connection_error", (err) => {
      logger.error(`Socket.IO Engine connection error: ${err.message}`, {
        code: err.code,
        context: err.context,
      });
    });

    // Log all active rooms periodically
    setInterval(() => {
      const rooms = this.io.sockets.adapter.rooms;
      const roomList: string[] = [];
      rooms.forEach((sockets, room) => {
        if (!room.startsWith("/")) {
          roomList.push(`${room}(${sockets.size})`);
        }
      });
      if (roomList.length > 0) {
        logger.debug(`Active rooms: ${roomList.join(", ")}`);
      }
      logger.debug(
        `Online users: ${this.userSockets.size}, Total sockets: ${this.io.sockets.sockets.size}`
      );
    }, 30000);
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      if (!userId) {
        logger.error(`Socket connected without userId! Socket: ${socket.id}`);
        socket.disconnect();
        return;
      }

      const userSocketCount = this.userSockets.get(userId)?.size || 0;
      logger.info(
        `User ${userId} connected with socket ${socket.id}, transport: ${socket.conn.transport.name}, existing sockets: ${userSocketCount}`
      );

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(socket.id);

      socket.join(`user:${userId}`);
      logger.debug(`User ${userId} joined personal room user:${userId}`);

      // Notify client that connection is ready and they should rejoin chats
      socket.emit("connection:ready", {
        userId,
        socketId: socket.id,
        message: "Please rejoin your chat rooms",
      });
      logger.info(`Sent connection:ready to user ${userId}, socket ${socket.id}`);

      // Log all events for debugging
      socket.onAny((eventName, ...args) => {
        logger.debug(
          `Socket ${socket.id} received event: ${eventName}, args: ${JSON.stringify(args)}`
        );
      });

      // Allow client to join multiple chats at once (for reconnection)
      socket.on("join:chats", (chatIds: number[]) => {
        logger.info(`User ${userId} requesting to join multiple chats: ${chatIds.join(", ")}`);
        chatIds.forEach((chatId) => {
          socket.join(`chat:${chatId}`);
        });
        const rooms = Array.from(socket.rooms);
        logger.info(
          `User ${userId} joined ${chatIds.length} chats, now in rooms: ${rooms.join(", ")}`
        );
        socket.emit("joined:chats", { chatIds });
      });

      socket.on("join:chat", (chatId: number) => {
        logger.info(`User ${userId} requesting to join chat ${chatId}`);
        socket.join(`chat:${chatId}`);
        logger.info(`User ${userId} joined chat room chat:${chatId}`);

        // Log current rooms for this socket
        const rooms = Array.from(socket.rooms);
        logger.debug(`Socket ${socket.id} is now in rooms: ${rooms.join(", ")}`);

        socket.emit("joined:chat", { chatId });
      });

      socket.on("leave:chat", (chatId: number) => {
        socket.leave(`chat:${chatId}`);
        logger.info(`User ${userId} left chat ${chatId}`);
        socket.emit("left:chat", { chatId });
      });

      socket.on("typing:start", (data: { chatId: number }) => {
        logger.debug(`User ${userId} started typing in chat ${data.chatId}`);
        socket.to(`chat:${data.chatId}`).emit("user:typing", {
          userId,
          chatId: data.chatId,
        });
      });

      socket.on("typing:stop", (data: { chatId: number }) => {
        logger.debug(`User ${userId} stopped typing in chat ${data.chatId}`);
        socket.to(`chat:${data.chatId}`).emit("user:stopped-typing", {
          userId,
          chatId: data.chatId,
        });
      });

      socket.on("message:read", (data: { messageId: number; chatId: number }) => {
        logger.debug(`User ${userId} read message ${data.messageId} in chat ${data.chatId}`);
        socket.to(`chat:${data.chatId}`).emit("message:read-status", {
          messageId: data.messageId,
          userId,
          status: "read",
        });
      });

      socket.on("error", (error) => {
        logger.error(`Socket ${socket.id} error:`, error);
      });

      socket.on("disconnect", (reason) => {
        // Detailed disconnect reason logging
        const disconnectReasons: Record<string, string> = {
          "io server disconnect":
            "Server forcefully disconnected (token invalid or server called disconnect())",
          "io client disconnect": "Client called socket.disconnect()",
          "ping timeout": "Client didn't respond to ping within timeout period",
          "transport close": "Connection was closed (user closed tab, lost network, etc.)",
          "transport error": "Connection encountered an error (network issue)",
          "parse error": "Server received invalid packet from client",
        };
        const explanation = disconnectReasons[reason] || "Unknown reason";
        logger.info(
          `User ${userId} disconnected socket ${socket.id}, reason: ${reason} (${explanation})`
        );
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            logger.debug(`User ${userId} has no more active sockets`);
          } else {
            logger.debug(`User ${userId} still has ${userSocketSet.size} active socket(s)`);
          }
        }
      });
    });
  }

  public emitNewMessage(chatId: number, message: unknown) {
    const room = `chat:${chatId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    const socketCount = socketsInRoom ? socketsInRoom.size : 0;

    logger.info(`Emitting new message to room ${room}, sockets in room: ${socketCount}`);
    if (socketCount === 0) {
      logger.warn(`No sockets in room ${room}! Message may not be delivered.`);
    } else {
      logger.debug(
        `Sockets in room ${room}: ${socketsInRoom ? Array.from(socketsInRoom).join(", ") : "none"}`
      );
    }

    this.io.to(room).emit("message:new", message);
    logger.info(`Emitted new message to chat ${chatId}`);
  }

  public emitMessageDeleted(chatId: number, messageId: number) {
    const room = `chat:${chatId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    logger.info(`Emitting message deletion to room ${room}, sockets: ${socketsInRoom?.size || 0}`);

    this.io.to(room).emit("message:deleted", { chatId, messageId });
    logger.info(`Emitted message deletion to chat ${chatId}`);
  }

  public emitNewChat(userId: number, chat: unknown) {
    const room = `user:${userId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    logger.info(`Emitting new chat to room ${room}, sockets: ${socketsInRoom?.size || 0}`);

    this.io.to(room).emit("chat:new", chat);
    logger.info(`Emitted new chat to user ${userId}`);
  }

  public emitChatDeleted(chatId: number, userIds: number[]) {
    userIds.forEach((userId) => {
      const room = `user:${userId}`;
      const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
      logger.debug(`Emitting chat deletion to room ${room}, sockets: ${socketsInRoom?.size || 0}`);
      this.io.to(room).emit("chat:deleted", { chatId });
    });
    logger.info(`Emitted chat deletion to ${userIds.length} users`);
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
