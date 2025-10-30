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

  async createPrivateChat(userId: number, otherUserId: number) {
    const chatRepository = AppDataSource.getRepository(Chat);
    const chatMemberRepository = AppDataSource.getRepository(ChatMember);

    const existingChat = await chatRepository
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
      .getOne();

    if (existingChat) {
      return existingChat;
    }

    const chat = chatRepository.create({
      chat_type: "private",
      created_by: { id: userId },
    });
    await chatRepository.save(chat);

    const member1 = chatMemberRepository.create({
      chat_id: chat.id,
      user_id: userId,
    });
    const member2 = chatMemberRepository.create({
      chat_id: chat.id,
      user_id: otherUserId,
    });
    await chatMemberRepository.save([member1, member2]);

    return chat;
  }

  async createGroupChat(userId: number, name: string, memberIds: number[]) {
    // Remove userId from memberIds and ensure unique IDs
    const uniqueMemberIds = [
      ...new Set(memberIds.filter((id) => id !== userId)),
    ];
    if (uniqueMemberIds.length !== memberIds.length) {
      throw new AppError("Duplicate or invalid member IDs provided", 400);
    }

    // Check if all users exist
    const users = await this.userRepository.findBy({
      id: In([userId, ...uniqueMemberIds]),
    });
    if (users.length !== uniqueMemberIds.length + 1) {
      throw new AppError("One or more users not found", 404);
    }

    // Create chat
    const chat = this.chatRepository.create({
      chat_type: "group",
      name,
      created_by: { id: userId },
    });
    await this.chatRepository.save(chat);

    // Create members (creator as admin, others as members)
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

    return chat;
  }

  async getUserChats(userId: number) {
    const chatRepository = AppDataSource.getRepository(Chat);
    return chatRepository
      .createQueryBuilder("chat")
      .innerJoin("chat_members", "cm", "cm.chat_id = chat.id")
      .where("cm.user_id = :userId", { userId })
      .getMany();
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
