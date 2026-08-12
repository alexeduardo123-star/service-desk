# Service Desk — Frontend

Front-end React (Vite) do sistema de chamados/tickets de suporte técnico.
Consome a API em `backend/`. Documentação completa da arquitetura, portas,
CORS, banco de dados e produção (PM2 + Nginx) está no
**[README do backend](backend/README.md)**.

## Rodando localmente

```bash
npm install
npm run dev   # http://localhost:5173
```

Requer a API rodando em `http://localhost:3000` (ver README do backend).

## Estrutura de `src/`

```
auth/        Context API de autenticação (login, logout, token, usuário logado)
routes/      react-router-dom + RotaPrivada (protege rotas por login/papel)
services/    instância única do axios (api.js) + um módulo por recurso da API
views/       páginas completas (Login, Home, Tickets, Usuários, ...)
components/  UI reutilizável (Botao, InputField, StatusBadge, CrudTable, ...)
layouts/     AppLayout: sidebar + header + footer das telas autenticadas
store/       estado global além do auth (notificações/toasts)
configs/     URL da API por ambiente (dev/prod)
constants/   labels e cores de exibição (status, papel)
enum/        StatusTicket, PapelUsuario
utils/       formatação de data, validação de formulário
```

## Perfis de usuário

- **ADMIN**: acesso total, inclusive cadastro de usuários/departamentos/
  categorias/prioridades.
- **TECNICO**: gerencia chamados (status, atribuição), equipamentos e base
  de conhecimento.
- **SOLICITANTE**: abre chamados e acompanha os próprios.

## Tailwind CSS

Escolhido em vez de Bootstrap por integrar via plugin nativo do Vite
(`@tailwindcss/vite`, sem build step extra) e por permitir montar os
componentes de `components/` (tabelas, badges, formulários) com classes
utilitárias direto no JSX, sem escrever CSS à parte para cada tela.
