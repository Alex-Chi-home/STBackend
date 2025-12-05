import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chatService";
import { getSocketService } from "../config/socket";

export class ChatController {
  private chatService = new ChatService();

  async createPrivateChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { otherUserId } = req.body;

      const chat = await this.chatService.createPrivateChat(req.user!.id, otherUserId);

      try {
        const socketService = getSocketService();
        socketService.emitNewChat(req.user!.id, chat);
        socketService.emitNewChat(otherUserId, chat);
      } catch (socketError) {
        console.error("Failed to emit new chat via WebSocket:", socketError);
      }

      res.status(201).json({ status: "success", data: chat });
    } catch (error) {
      next(error);
    }
  }

  async createGroupChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, memberIds } = req.body;
      const chat = await this.chatService.createGroupChat(req.user!.id, name, memberIds);

      try {
        const socketService = getSocketService();
        const allMemberIds = [req.user!.id, ...memberIds];
        allMemberIds.forEach((memberId) => {
          socketService.emitNewChat(memberId, chat);
        });
      } catch (socketError) {
        console.error("Failed to emit new group chat via WebSocket:", socketError);
      }

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

      const chatMembers = await this.chatService.getChatMembers(chatId);

      const result = await this.chatService.deleteChat(chatId, req.user!.id);

      try {
        const socketService = getSocketService();
        const memberIds = chatMembers.map((member: any) => member.user_id);
        socketService.emitChatDeleted(chatId, memberIds);
      } catch (socketError) {
        console.error("Failed to emit chat deletion via WebSocket:", socketError);
      }

      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}
