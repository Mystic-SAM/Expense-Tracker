import { UserModel } from "../models/user.model.js";
import { Logger } from "../utils/logger.js";

export const findByIdUserService = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    Logger.debug("User not found by ID", { userId });
  }
  return user?.omitPassword();
};