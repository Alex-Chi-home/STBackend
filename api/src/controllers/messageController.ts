import { NextFunction, Request, Response } from "express";
import { MessageService } from "../services/messageService";
import { getSocketService } from "../config/socket";

export class MessageController {
  private messageService = new MessageService();

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId, content } = req.body;

      const message = await this.messageService.sendMessage(
        chatId,
        req.user!.id,
        content
      );

      try {
        const socketService = getSocketService();
        socketService.emitNewMessage(chatId, message);
      } catch (socketError) {
        console.error("Failed to emit message via WebSocket:", socketError);
      }

      res.status(201).json({ status: "success", data: message });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId, id } = req.body;

      const result = await this.messageService.deleteMessage(
        parseInt(chatId),
        req.user!.id,
        parseInt(id)
      );

      try {
        const socketService = getSocketService();
        socketService.emitMessageDeleted(parseInt(chatId), parseInt(id));
      } catch (socketError) {
        console.error("Failed to emit message deletion via WebSocket:", socketError);
      }

      res.status(200).json({ status: "success", data: result });
    } catch (error) {
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
