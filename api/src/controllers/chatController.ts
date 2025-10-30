import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chatService";

export class ChatController {
  private chatService = new ChatService();

  async createPrivateChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { otherUserId } = req.body;
      const chat = await this.chatService.createPrivateChat(
        req.user!.id,
        otherUserId
      );
      res.status(201).json({ status: "success", data: chat });
    } catch (error) {
      next(error);
    }
  }

  async createGroupChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, memberIds } = req.body;
      const chat = await this.chatService.createGroupChat(
        req.user!.id,
        name,
        memberIds
      );
      res.status(201).json({ status: "success", data: chat });
    } catch (error) {
      next(error);
    }
  }

  async getUserChats(req: Request, res: Response) {
    const chats = await this.chatService.getUserChats(req.user!.id);
    res.json({ status: "success", data: chats });
  }

  async deleteChat(req: Request, res: Response, next: NextFunction) {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        throw new Error("Invalid chat ID");
      }
      const result = await this.chatService.deleteChat(chatId, req.user!.id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
