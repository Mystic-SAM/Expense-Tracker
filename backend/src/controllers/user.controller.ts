import { findByIdUserService } from "../services/user.service.js";
import type { Request, Response } from "express";
import { HTTP_STATUS } from "../config/http.config.js";
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const user = await findByIdUserService(userId);
    return res.status(HTTP_STATUS.OK).json({
      message: "User fetched successfully",
      user,
    });
  }
);
