import { AppDataSource } from "../config/database";
import { User } from "../models/User";

export class UserService {
  async getUser(userId: number) {
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: userId },
      select: ["id", "username", "email"],
    });

    return user;
  }
}
