import { AppDataSource } from "../config/database";
import { Message } from "../models/Message";
import { ChatMember } from "../models/ChatMember";
import { MessageStatus } from "../models/MessageStatus";
import { AppError } from "../types";

export class MessageService {
  async sendMessage(chatId: number, userId: number, content: string) {
    const chatMemberRepository = AppDataSource.getRepository(ChatMember);
    const messageRepository = AppDataSource.getRepository(Message);
    const messageStatusRepository = AppDataSource.getRepository(MessageStatus);

    const isMember = await chatMemberRepository.findOne({
      where: { chat_id: chatId, user_id: userId },
    });

    if (!isMember) {
      throw new AppError("User is not a member of this chat", 403);
    }

    const message = messageRepository.create({
      chat_id: chatId,
      sender_id: userId,
      content,
    });
    await messageRepository.save(message);

    const chatMembers = await chatMemberRepository.find({
      where: { chat_id: chatId },
    });

    const messageStatuses = chatMembers
      .filter((member) => member.user_id !== userId)
      .map((member) =>
        messageStatusRepository.create({
          message_id: message.id,
          user_id: member.user_id,
          status: "sent",
        })
      );
    await messageStatusRepository.save(messageStatuses);

    return message;
  }

  async deleteMessage(chatId: number, userId: number, messageId: number) {
    return await AppDataSource.transaction(
      async (transactionalEntityManager) => {
        const chatMemberRepository =
          transactionalEntityManager.getRepository(ChatMember);
        const messageRepository =
          transactionalEntityManager.getRepository(Message);
        const messageStatusRepository =
          transactionalEntityManager.getRepository(MessageStatus);

        const chatMember = await chatMemberRepository.findOne({
          where: { chat_id: chatId, user_id: userId },
        });
        if (!chatMember) {
          throw new AppError("User is not a member of this chat", 403);
        }

        const message = await messageRepository.findOne({
          where: { id: messageId, chat_id: chatId },
        });
        if (!message) {
          throw new AppError("Message not found", 404);
        }

        if (message.sender_id !== userId && chatMember.role !== "admin") {
          throw new AppError(
            "You are not authorized to delete this message",
            403
          );
        }

        message.is_deleted = true;
        await messageRepository.save(message);

        const chatMembers = await chatMemberRepository.find({
          where: { chat_id: chatId },
        });

        const messageStatuses = await messageStatusRepository.find({
          where: { message_id: messageId },
        });

        for (const status of messageStatuses) {
          status.status = "deleted";
          await messageStatusRepository.save(status);
        }

        const newStatuses = chatMembers
          .filter(
            (member) =>
              !messageStatuses.some(
                (status) => status.user_id === member.user_id
              )
          )
          .map((member) =>
            messageStatusRepository.create({
              message_id: messageId,
              user_id: member.user_id,
              status: "deleted",
            })
          );
        await messageStatusRepository.save(newStatuses);

        return { id: messageId, chat_id: chatId, is_deleted: true };
      }
    );
  }

  async getChatMessages(userId: number, chatId: number) {
    const chatMemberRepository = AppDataSource.getRepository(ChatMember);
    const messageRepository = AppDataSource.getRepository(Message);

    const isMember = await chatMemberRepository.findOne({
      where: { chat_id: chatId, user_id: userId },
    });
    if (!isMember) {
      throw new AppError("User is not a member of this chat", 403);
    }

    const messages = await messageRepository.find({
      where: { chat_id: chatId, is_deleted: false },
      relations: ["sender"],
      order: { sent_at: "ASC" },
    });
    return messages;
  }
}
