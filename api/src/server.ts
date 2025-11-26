import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { AppDataSource } from "./config/database";
import app from "./app";
import logger from "./config/logger";
import { initializeSocketService } from "./config/socket";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

const envFile =
  process.env.NODE_ENV === "production" ? ".env" : ".env.development";
const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

logger.info(
  `Loading environment from: ${envFile} (NODE_ENV=${process.env.NODE_ENV})`
);

const PORT = process.env.PORT || 3000;

logger.info("🔧 Server configuration", {
  nodeEnv: process.env.NODE_ENV,
  port: PORT,
  frontendUrl: process.env.FRONTEND_URL,
  ngrokUrl: process.env.NGROK_URL,
  databaseHost: process.env.DB_HOST,
  databasePort: process.env.DB_PORT,
  databaseName: process.env.DB_NAME,
});

// Create HTTP server
const httpServer = createServer(app);
logger.info("✅ HTTP server created");

// Initialize Socket.IO
logger.info("🔌 Initializing Socket.IO...");
initializeSocketService(httpServer);

AppDataSource.initialize()
  .then(() => {
    logger.info("✅ Database connected successfully");

    httpServer.listen(PORT, () => {
      logger.info("🚀 Server is running", {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        httpEndpoint: `http://localhost:${PORT}`,
        wsEndpoint: `ws://localhost:${PORT}`,
      });
      logger.info("✅ Socket.IO is ready for connections");
      logger.info("📡 WebSocket transports: websocket, polling");
      logger.info("🔐 WebSocket authentication: JWT required");

      // Логируем важную информацию для production
      if (process.env.NODE_ENV === "production") {
        logger.info("⚠️ PRODUCTION MODE", {
          frontendUrl: process.env.FRONTEND_URL,
          corsEnabled: true,
          allowedOrigins: [
            process.env.FRONTEND_URL,
            process.env.NGROK_URL,
          ].filter(Boolean),
        });
      }
    });
  })
  .catch((error) => {
    logger.error("❌ Database connection error", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
