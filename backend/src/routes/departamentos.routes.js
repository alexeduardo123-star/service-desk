import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("departamento");

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", requirePermission("DEPARTAMENTOS_GERENCIAR"), controller.criar);
router.put("/:id", requirePermission("DEPARTAMENTOS_GERENCIAR"), controller.atualizar);
router.delete("/:id", requirePermission("DEPARTAMENTOS_GERENCIAR"), controller.excluir);

export default router;
