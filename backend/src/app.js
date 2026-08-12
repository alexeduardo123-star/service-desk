import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import departamentosRoutes from "./routes/departamentos.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import prioridadesRoutes from "./routes/prioridades.routes.js";
import equipamentosRoutes from "./routes/equipamentos.routes.js";
import ticketsRoutes from "./routes/tickets.routes.js";
import baseConhecimentoRoutes from "./routes/baseConhecimento.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// CORS resolvido aqui no backend, apontando explicitamente para a origem do
// front (Vite dev server). Não depende de proxy/extensão de navegador.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "servicedesk-api" });
});

app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/departamentos", departamentosRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/prioridades", prioridadesRoutes);
app.use("/equipamentos", equipamentosRoutes);
app.use("/tickets", ticketsRoutes);
app.use("/base-conhecimento", baseConhecimentoRoutes);

app.use(errorHandler);

export default app;
