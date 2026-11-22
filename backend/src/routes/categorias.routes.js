import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requirePermission } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("categoria");

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", requirePermission("CATEGORIAS_GERENCIAR"), controller.criar);
router.put("/:id", requirePermission("CATEGORIAS_GERENCIAR"), controller.atualizar);
router.delete("/:id", requirePermission("CATEGORIAS_GERENCIAR"), controller.excluir);

export default router;
