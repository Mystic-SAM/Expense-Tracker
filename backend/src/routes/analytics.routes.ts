import { Router } from "express";
import { summaryAnalyticsController } from "../controllers/analytics.controller.js";

const analyticsRoutes = Router();

analyticsRoutes.get("/summary", summaryAnalyticsController);

export default analyticsRoutes;
