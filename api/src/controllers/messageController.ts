import { NextFunction, Request, Response } from "express";
import { MessageService } from "../services/messageService";
import { getSocketService } from "../config/socket";
import logger from "../config/logger";

export class MessageController {
  private messageService = new MessageService();

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId, content } = req.body;

      logger.info("📝 Sending message", {
        userId: req.user!.id,
        chatId,
        contentLength: content?.length,
      });

      const message = await this.messageService.sendMessage(
        chatId,
        req.user!.id,
        content
      );

      logger.info("✅ Message saved to database", {
        messageId: message.id,
        chatId,
        senderId: req.user!.id,
      });

      // Emit new message via WebSocket
      try {
        logger.info("🔌 Attempting to emit WebSocket event", {
          event: "message:new",
          chatId,
          messageId: message.id,
        });

        const socketService = getSocketService();
        socketService.emitNewMessage(chatId, message);

        logger.info("✅ WebSocket event emitted successfully", {
          event: "message:new",
          chatId,
          messageId: message.id,
        });
      } catch (socketError: any) {
        logger.error("❌ Failed to emit message via WebSocket", {
          error: socketError.message,
          stack: socketError.stack,
          chatId,
          messageId: message.id,
        });
      }

      res.status(201).json({ status: "success", data: message });
    } catch (error) {
      logger.error("❌ Error in sendMessage", {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
        chatId: req.body?.chatId,
      });
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId, id } = req.body;

      logger.info("🗑️ Deleting message", {
        userId: req.user!.id,
        chatId: parseInt(chatId),
        messageId: parseInt(id),
      });

      const result = await this.messageService.deleteMessage(
        parseInt(chatId),
        req.user!.id,
        parseInt(id)
      );

      logger.info("✅ Message deleted from database", {
        chatId: parseInt(chatId),
        messageId: parseInt(id),
      });

      // Emit message deletion via WebSocket
      try {
        logger.info("🔌 Attempting to emit WebSocket event", {
          event: "message:deleted",
          chatId: parseInt(chatId),
          messageId: parseInt(id),
        });

        const socketService = getSocketService();
        socketService.emitMessageDeleted(parseInt(chatId), parseInt(id));

        logger.info("✅ WebSocket event emitted successfully", {
          event: "message:deleted",
          chatId: parseInt(chatId),
          messageId: parseInt(id),
        });
      } catch (socketError: any) {
        logger.error("❌ Failed to emit message deletion via WebSocket", {
          error: socketError.message,
          stack: socketError.stack,
          chatId: parseInt(chatId),
          messageId: parseInt(id),
        });
      }

      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      logger.error("❌ Error in deleteMessage", {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
        chatId: req.body?.chatId,
        messageId: req.body?.id,
      });
      next(error);
    }
  }

  async getChatMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const messages = await this.messageService.getChatMessages(
        req.user!.id,
        parseInt(chatId)
      );
      res.json({ status: "success", data: messages });
    } catch (error) {
      next(error);
    }
  }
}
