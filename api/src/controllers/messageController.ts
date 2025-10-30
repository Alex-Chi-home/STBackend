import { NextFunction, Request, Response } from "express";
import { MessageService } from "../services/messageService";

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
