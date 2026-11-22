import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("equipamento");

router.use(authMiddleware);
router.get("/", requirePermission("EQUIPAMENTOS_ACESSAR"), controller.listar);
router.get("/:id", requirePermission("EQUIPAMENTOS_ACESSAR"), controller.buscar);

router.post("/", requirePermission("EQUIPAMENTOS_ACESSAR"), controller.criar);
router.put("/:id", requirePermission("EQUIPAMENTOS_ACESSAR"), controller.atualizar);
router.delete("/:id", requirePermission("EQUIPAMENTOS_EXCLUIR"), controller.excluir);

export default router;
