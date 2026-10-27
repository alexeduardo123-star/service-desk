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

## Subindo o projeto (jeito rápido)

Pré-requisitos: [Node.js 22 LTS](https://nodejs.org) e
[Docker Desktop](https://www.docker.com/products/docker-desktop/) **aberto**.
Não precisa instalar o PostgreSQL: ele roda num container já configurado
(`docker-compose.yml`).

```bash
git clone <url-do-repo>
cd meu-projeto
npm run setup     # só na primeira vez: banco, .env, dependências, tabelas e dados de teste
npm run dev       # sobe backend (3000) e frontend (5173) juntos — Ctrl+C para tudo
```

Acesse http://localhost:5173 e entre com `admin@servicedesk.com` / `123456`.

Outros comandos (na raiz):

- `npm run db:down` — para o container do banco (os dados ficam salvos)
- `npm run db:reset` — **apaga o banco** e recria tudo do zero

Se já existir outro PostgreSQL usando a porta 5432 no seu computador, o
setup avisa. Pare o outro serviço ou use outra porta (fica salva no `.env`
da raiz): `$env:DB_PORT=5433; npm run setup` (PowerShell) ou
`DB_PORT=5433 npm run setup` (Git Bash/Linux/Mac).

## Subindo o projeto (manual, sem Docker)

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
