import { Not } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";

export class UsersService {
  async getUsers(currentUserId: number) {
    const usersRepository = AppDataSource.getRepository(User);

    const user = await usersRepository.find({
      where: { id: Not(currentUserId) },
      select: ["id", "username", "email"],
    });

    return user;
  }
}
