import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requireRole } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("equipamento");

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", requireRole("ADMIN", "TECNICO"), controller.criar);
router.put("/:id", requireRole("ADMIN", "TECNICO"), controller.atualizar);
router.delete("/:id", requireRole("ADMIN"), controller.excluir);

export default router;
