import { In, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Chat } from "../models/Chat";
import { ChatMember } from "../models/ChatMember";
import { AppError } from "../types";
import { User } from "../models/User";

export class ChatService {
  private chatRepository: Repository<Chat> = AppDataSource.getRepository(Chat);
  private chatMemberRepository: Repository<ChatMember> =
    AppDataSource.getRepository(ChatMember);
  private userRepository: Repository<User> = AppDataSource.getRepository(User);


  private formatChatResponse(chat: Chat, currentUserId: number) {
    const createdBy = chat.created_by
      ? { id: chat.created_by.id, username: chat.created_by.username }
      : null;

    const members = chat.chatMembers
      ? chat.chatMembers
          .filter((cm) => cm.user_id !== currentUserId)
          .map((cm) => ({
            id: cm.user.id,
            username: cm.user.username,
          }))
      : [];

    return {
      id: chat.id,
      chat_type: chat.chat_type,
      name: chat.name,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      created_by: createdBy,
      members,
    };
  }

  async createPrivateChat(userId: number, otherUserId: number) {
    const existingChat = await this.chatRepository
      .createQueryBuilder("chat")
      .innerJoin("chat_members", "cm1", "cm1.chat_id = chat.id")
      .innerJoin(
        "chat_members",
        "cm2",
        "cm2.chat_id = chat.id AND cm2.user_id != cm1.user_id"
      )
      .where("chat.chat_type = :type", { type: "private" })
      .andWhere("cm1.user_id = :user1 AND cm2.user_id = :user2", {
        user1: userId,
        user2: otherUserId,
      })
      .leftJoinAndSelect("chat.created_by", "created_by")
      .leftJoinAndSelect("chat.chatMembers", "chatMembers")
      .leftJoinAndSelect("chatMembers.user", "memberUser")
      .getOne();

    if (existingChat) {
      return this.formatChatResponse(existingChat, userId);
    }

    const chat = this.chatRepository.create({
      chat_type: "private",
      created_by: { id: userId },
    });
    await this.chatRepository.save(chat);

    const member1 = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: userId,
    });
    const member2 = this.chatMemberRepository.create({
      chat_id: chat.id,
      user_id: otherUserId,
    });
    await this.chatMemberRepository.save([member1, member2]);

    // Reload chat with all relations
    const fullChat = await this.chatRepository.findOne({
      where: { id: chat.id },
      relations: ["created_by", "chatMembers", "chatMembers.user"],
    });

    return this.formatChatResponse(fullChat!, userId);
  }

  async createGroupChat(userId: number, name: string, memberIds: number[]) {
    const uniqueMemberIds = [
      ...new Set(memberIds.filter((id) => id !== userId)),
    ];
    if (uniqueMemberIds.length !== memberIds.length) {
      throw new AppError("Duplicate or invalid member IDs provided", 400);
    }

    const users = await this.userRepository.findBy({
      id: In([userId, ...uniqueMemberIds]),
    });
    if (users.length !== uniqueMemberIds.length + 1) {
      throw new AppError("One or more users not found", 404);
    }

    const chat = this.chatRepository.create({
      chat_type: "group",
      name,
      created_by: { id: userId },
    });
    await this.chatRepository.save(chat);

    const members = uniqueMemberIds.map((id) =>
      this.chatMemberRepository.create({
        chat_id: chat.id,
        user_id: id,
        role: "member",
      })
    );
    members.push(
      this.chatMemberRepository.create({
        chat_id: chat.id,
        user_id: userId,
        role: "admin",
      })
    );
    await this.chatMemberRepository.save(members);

    // Reload chat with all relations
    const fullChat = await this.chatRepository.findOne({
      where: { id: chat.id },
      relations: ["created_by", "chatMembers", "chatMembers.user"],
    });

    return this.formatChatResponse(fullChat!, userId);
  }

  async getUserChats(userId: number) {
    const chats = await this.chatRepository
      .createQueryBuilder("chat")
      .innerJoin("chat_members", "cm", "cm.chat_id = chat.id")
      .leftJoinAndSelect("chat.created_by", "created_by")
      .leftJoinAndSelect("chat.chatMembers", "chatMembers")
      .leftJoinAndSelect("chatMembers.user", "memberUser")
      .where("cm.user_id = :userId", { userId })
      .getMany();

    return chats.map((chat) => this.formatChatResponse(chat, userId));
  }

  async getChatMembers(chatId: number) {
    return this.chatMemberRepository.find({
      where: { chat_id: chatId },
    });
  }

  async deleteChat(chatId: number, userId: number) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["created_by"],
    });

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (chat.chat_type === "group" && chat.created_by.id !== userId) {
      throw new AppError(
        "You are not authorized to delete this group chat",
        403
      );
    }

    if (chat.chat_type === "private") {
      const isMember = await this.chatMemberRepository.findOne({
        where: { chat_id: chatId, user_id: userId },
      });
      if (!isMember) {
        throw new AppError("You are not a member of this chat", 403);
      }
    }

    await this.chatRepository.remove(chat);

    return { message: "Chat deleted successfully" };
  }
}
