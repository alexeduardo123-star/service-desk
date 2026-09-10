# Service Desk

Sistema de chamados/tickets de suporte técnico, dividido em duas aplicações
independentes dentro deste repositório:

```
service-desk/
├── backend/    API REST — Node.js + Express + Prisma + PostgreSQL (porta 3000)
└── frontend/   SPA — React + Vite + Tailwind CSS (porta 5173)
```

Cada pasta tem seu próprio `package.json`, `node_modules` e README.

| Pasta | O que é | README |
|-------|---------|--------|
| `backend/` | API, autenticação JWT, modelagem do banco, CORS, produção | [backend/README.md](backend/README.md) |
| `frontend/` | Telas, rotas protegidas, consumo da API via axios | [frontend/README.md](frontend/README.md) |

## Subindo o projeto

Pré-requisito: PostgreSQL rodando na porta 5432 (ver
[README do backend](backend/README.md) para criar usuário e banco).

```bash
# terminal 1 — API
cd backend
npm install
cp .env.example .env        # ajuste DATABASE_URL/JWT_SECRET se necessário
npx prisma migrate dev      # cria as tabelas
node prisma/seed.js         # popula dados de teste
npm run dev                 # http://localhost:3000

# terminal 2 — front
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Usuários de teste (senha `123456`): `admin@servicedesk.com`,
`tecnico@servicedesk.com`, `usuario@servicedesk.com`.
