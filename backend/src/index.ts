import "dotenv/config";
import { Env } from "./config/env.config.js";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { HTTP_STATUS } from "./config/http.config.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(HTTP_STATUS.OK).json({
    message: "Hello, This is the Expense Tracker API!",
  });
});

app.listen(Env.PORT, async () => {
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
