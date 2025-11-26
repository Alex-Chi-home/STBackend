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

    logger.info('🔌 Initializing Socket.IO server', {
      nodeEnv: process.env.NODE_ENV,
      allowedOrigins,
      frontendUrl: process.env.FRONTEND_URL,
      ngrokUrl: process.env.NGROK_URL,
    });

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          logger.info('🌐 CORS check for Socket.IO', {
            origin,
            nodeEnv: process.env.NODE_ENV,
            allowedOrigins
          });

          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) {
            logger.info('✅ CORS: Allowing request with no origin');
            return callback(null, true);
          }

          // Allow all origins in development
          if (process.env.NODE_ENV === "development") {
            logger.info('✅ CORS: Allowing all origins (development mode)');
            return callback(null, true);
          }

          // Check allowed origins in production
          if (allowedOrigins.includes(origin)) {
            logger.info(`✅ CORS: Allowing origin ${origin}`);
            return callback(null, true);
          }

          logger.warn(`❌ CORS: Blocked request from origin: ${origin}`, {
            origin,
            allowedOrigins,
            nodeEnv: process.env.NODE_ENV,
          });
          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    logger.info('✅ Socket.IO server created successfully');

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    logger.info('🔐 Setting up Socket.IO authentication middleware');

    // JWT Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        logger.info('🔑 Socket connection attempt', {
          socketId: socket.id,
          transport: socket.conn.transport.name,
          origin: socket.handshake.headers.origin,
          userAgent: socket.handshake.headers['user-agent'],
          hasAuthToken: !!socket.handshake.auth.token,
          hasAuthHeader: !!socket.handshake.headers.authorization,
        });

        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          logger.warn("❌ Socket connection attempt without token", {
            socketId: socket.id,
            origin: socket.handshake.headers.origin,
            authObject: socket.handshake.auth,
            headers: socket.handshake.headers,
          });
          return next(new Error("Authentication token missing"));
        }

        logger.info('🔍 Verifying JWT token', {
          socketId: socket.id,
          tokenPreview: token.substring(0, 20) + '...',
        });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: number;
        };

        socket.userId = decoded.userId;
        logger.info(`✅ Socket authenticated successfully`, {
          socketId: socket.id,
          userId: decoded.userId,
          transport: socket.conn.transport.name,
        });
        next();
      } catch (error: any) {
        logger.error("❌ Socket authentication error", {
          socketId: socket.id,
          error: error.message,
          errorName: error.name,
          stack: error.stack,
        });
        next(new Error("Invalid or expired token"));
      }
    });

    logger.info('✅ Socket.IO middleware setup complete');
  }

  private setupEventHandlers() {
    logger.info('📡 Setting up Socket.IO event handlers');

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(`🎉 User connected`, {
        userId,
        socketId: socket.id,
        transport: socket.conn.transport.name,
        totalConnections: this.io.sockets.sockets.size,
      });

      // Track user's socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      logger.info(`👤 User socket tracking updated`, {
        userId,
        socketCount: this.userSockets.get(userId)!.size,
        totalUsers: this.userSockets.size,
      });

      // Join user to their personal room
      socket.join(`user:${userId}`);
      logger.info(`🏠 User joined personal room`, {
        userId,
        room: `user:${userId}`,
      });

      // Handle joining chat rooms
      socket.on("join:chat", (chatId: number) => {
        socket.join(`chat:${chatId}`);
        logger.info(`🔗 User joined chat`, {
          userId,
          socketId: socket.id,
          chatId,
          room: `chat:${chatId}`,
        });
        socket.emit("joined:chat", { chatId });
      });

      // Handle leaving chat rooms
      socket.on("leave:chat", (chatId: number) => {
        socket.leave(`chat:${chatId}`);
        logger.info(`👋 User left chat`, {
          userId,
          socketId: socket.id,
          chatId,
          room: `chat:${chatId}`,
        });
        socket.emit("left:chat", { chatId });
      });

      // Handle typing indicators
      socket.on("typing:start", (data: { chatId: number }) => {
        logger.info(`⌨️ User started typing`, {
          userId,
          socketId: socket.id,
          chatId: data.chatId,
        });
        socket.to(`chat:${data.chatId}`).emit("user:typing", {
          userId,
          chatId: data.chatId,
        });
      });

      socket.on("typing:stop", (data: { chatId: number }) => {
        logger.info(`⏸️ User stopped typing`, {
          userId,
          socketId: socket.id,
          chatId: data.chatId,
        });
        socket.to(`chat:${data.chatId}`).emit("user:stopped-typing", {
          userId,
          chatId: data.chatId,
        });
      });

      // Handle message read status
      socket.on("message:read", (data: { messageId: number; chatId: number }) => {
        logger.info(`👁️ Message marked as read`, {
          userId,
          socketId: socket.id,
          messageId: data.messageId,
          chatId: data.chatId,
        });
        socket.to(`chat:${data.chatId}`).emit("message:read-status", {
          messageId: data.messageId,
          userId,
          status: "read",
        });
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        logger.info(`👋 User disconnected`, {
          userId,
          socketId: socket.id,
          reason,
          transport: socket.conn.transport.name,
          totalConnections: this.io.sockets.sockets.size,
        });

        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          logger.info(`🔄 Updated user socket tracking`, {
            userId,
            remainingSockets: userSocketSet.size,
          });

          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            logger.info(`🚪 User fully disconnected (no more sockets)`, {
              userId,
              totalUsers: this.userSockets.size,
            });
          }
        }
      });

      // Handle errors
      socket.on("error", (error) => {
        logger.error(`❌ Socket error`, {
          userId,
          socketId: socket.id,
          error: error.message,
          stack: error.stack,
        });
      });
    });

    logger.info('✅ Socket.IO event handlers setup complete');
  }

  // Emit new message to chat participants
  public emitNewMessage(chatId: number, message: any) {
    const room = `chat:${chatId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);

    logger.info(`📨 Emitting new message`, {
      chatId,
      messageId: message.id,
      senderId: message.sender_id,
      room,
      recipientsCount: socketsInRoom?.size || 0,
      recipients: socketsInRoom ? Array.from(socketsInRoom) : [],
    });

    this.io.to(room).emit("message:new", message);
  }

  // Emit message deletion to chat participants
  public emitMessageDeleted(chatId: number, messageId: number) {
    const room = `chat:${chatId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);

    logger.info(`🗑️ Emitting message deletion`, {
      chatId,
      messageId,
      room,
      recipientsCount: socketsInRoom?.size || 0,
    });

    this.io.to(room).emit("message:deleted", { chatId, messageId });
  }

  // Emit new chat creation to user
  public emitNewChat(userId: number, chat: any) {
    const room = `user:${userId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);

    logger.info(`💬 Emitting new chat`, {
      userId,
      chatId: chat.id,
      room,
      recipientsCount: socketsInRoom?.size || 0,
    });

    this.io.to(room).emit("chat:new", chat);
  }

  // Emit chat deletion to participants
  public emitChatDeleted(chatId: number, userIds: number[]) {
    logger.info(`🗑️ Emitting chat deletion`, {
      chatId,
      userIds,
      userCount: userIds.length,
    });

    userIds.forEach((userId) => {
      const room = `user:${userId}`;
      this.io.to(room).emit("chat:deleted", { chatId });
    });
  }

  // Get Socket.IO instance
  public getIO(): Server {
    return this.io;
  }

  // Check if user is online
  public isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}

let socketService: SocketService | null = null;

export const initializeSocketService = (httpServer: HTTPServer): SocketService => {
  if (!socketService) {
    logger.info("🚀 Initializing Socket.IO service", {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL,
      ngrokUrl: process.env.NGROK_URL,
      jwtSecretExists: !!process.env.JWT_SECRET,
    });

    socketService = new SocketService(httpServer);

    logger.info("✅ Socket.IO service initialized successfully", {
      totalSockets: socketService.getIO().sockets.sockets.size,
      onlineUsers: socketService.getOnlineUsersCount(),
    });
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error("Socket service not initialized. Call initializeSocketService first.");
  }
  return socketService;
};

