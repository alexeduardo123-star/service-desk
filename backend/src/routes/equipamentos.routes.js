import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("equipamento");

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", requirePermissao("equipamentos.gerenciar"), controller.criar);
router.put("/:id", requirePermissao("equipamentos.gerenciar"), controller.atualizar);
router.delete("/:id", requirePermissao("equipamentos.excluir"), controller.excluir);

export default router;
