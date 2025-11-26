import winston from "winston";
import fs from "fs";
import path from "path";

// Создаем директорию logs если её нет
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Кастомный формат для консоли с цветами и эмодзи
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Формат для файлов
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    // Консоль - всегда включена
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Файл ошибок
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Общий лог
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Отдельный лог для WebSocket
    new winston.transports.File({
      filename: path.join(logsDir, "websocket.log"),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 3,
    }),
  ],
});

// В production режиме можно отключить консольные логи
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_CONSOLE_LOGS === 'true') {
  logger.remove(logger.transports[0]);
}

export default logger;
