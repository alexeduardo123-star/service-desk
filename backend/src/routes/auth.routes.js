import { Router } from "express";
import { login, registrar } from "../controllers/auth.controller.js";

const router = Router();

router.post("/registro", registrar);
router.post("/login", login);

export default router;
