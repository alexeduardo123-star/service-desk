import { Router } from "express";
import * as dashboard from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", dashboard.resumo);

export default router;
