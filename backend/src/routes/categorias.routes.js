import { Router } from "express";
import { makeCrudController } from "../controllers/crudFactory.js";
import { authMiddleware, requirePermissao } from "../middlewares/auth.js";

const router = Router();
const controller = makeCrudController("categoria");

router.use(authMiddleware);

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", requirePermissao("cadastros.gerenciar"), controller.criar);
router.put("/:id", requirePermissao("cadastros.gerenciar"), controller.atualizar);
router.delete("/:id", requirePermissao("cadastros.gerenciar"), controller.excluir);

export default router;
