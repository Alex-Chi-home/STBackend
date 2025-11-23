import dotenv from "dotenv";
import path from "path";
import { AppDataSource } from "./config/database";
import app from "./app";
import logger from "./config/logger";

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
AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Database connection error:", error);
    process.exit(1);
  });
