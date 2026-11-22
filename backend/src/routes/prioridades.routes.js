import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("prioridade");

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", requirePermission("PRIORIDADES_GERENCIAR"), controller.criar);
router.put("/:id", requirePermission("PRIORIDADES_GERENCIAR"), controller.atualizar);
router.delete("/:id", requirePermission("PRIORIDADES_GERENCIAR"), controller.excluir);

export default router;
