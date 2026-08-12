# Service Desk — Backend (API)

Sistema de chamados/tickets de suporte técnico. Esta pasta é a API
(Node.js + Express + PostgreSQL); o front-end (React + Vite) fica na raiz
deste mesmo repositório.

## Arquitetura cliente-servidor

```
┌────────────────────┐        HTTP/JSON        ┌──────────────────────┐        SQL        ┌──────────────┐
│  React (Vite)       │  ───────────────────▶  │  Express API          │  ───────────────▶ │  PostgreSQL   │
│  http://localhost:5173 │  ◀───────────────────  │  http://localhost:3000 │  ◀─────────────── │  porta 5432   │
└────────────────────┘        axios + JWT        └──────────────────────┘      Prisma        └──────────────┘
```

Front-end e back-end são dois processos Node separados, em portas
diferentes, mesmo em desenvolvimento — por isso o CORS precisa ser resolvido
explicitamente no backend (ver seção própria abaixo).

## Portas

| Serviço              | Porta |
|-----------------------|-------|
| Backend (Express)     | 3000  |
| Frontend (Vite dev)   | 5173  |
| PostgreSQL            | 5432  |

Antes de subir os serviços, verifique se as portas estão livres:

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :5432

# Mac/Linux (e WSL)
lsof -i :3000
lsof -i :5173
lsof -i :5432
```

## Como rodar localmente

### 1. Banco de dados (PostgreSQL)

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start   # WSL não usa systemd por padrão
sudo -u postgres psql -c "CREATE USER servicedesk_user WITH PASSWORD 'servicedesk_pw';"
sudo -u postgres psql -c "CREATE DATABASE servicedesk OWNER servicedesk_user;"
sudo -u postgres psql -c "ALTER USER servicedesk_user CREATEDB;" # necessário p/ shadow db do Prisma Migrate
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # ajuste DATABASE_URL/JWT_SECRET se necessário
npx prisma migrate dev      # cria as tabelas
node prisma/seed.js         # popula usuários/categorias/prioridades de teste
npm run dev                 # nodemon server.js, porta 3000
```

Alternativa sem ORM: `psql -U servicedesk_user -d servicedesk -f sql/schema.sql`
cria as tabelas diretamente via SQL puro (script equivalente ao
`prisma/schema.prisma`, entregue para fins de avaliação).

Usuários de teste (senha `123456` para todos):
- `admin@servicedesk.com` (ADMIN)
- `tecnico@servicedesk.com` (TECNICO)
- `usuario@servicedesk.com` (SOLICITANTE)

### 3. Frontend

```bash
cd ..
npm install
npm run dev                 # vite, porta 5173
```

Acesse `http://localhost:5173`.

## Banco de dados / ORM: por que Prisma

Optou-se por **Prisma** (sobre `pg` puro ou Sequelize) porque:
- o `schema.prisma` descreve as 8 entidades e seus relacionamentos em um
  único arquivo declarativo, mais rápido de revisar do que 8 conjuntos de
  queries manuais;
- `prisma migrate dev` gera e versiona as migrations automaticamente;
- o client gerado é type-safe e evita SQL manual repetitivo nos 8 CRUDs.

Como contrapartida — e para deixar explícito o modelo relacional em SQL puro,
que é o formato pedido na disciplina — o arquivo `sql/schema.sql` traz o
`CREATE TABLE` equivalente de cada tabela, independente do Prisma.

## Autenticação (JWT)

- `POST /auth/login` e `POST /auth/registro` (público) retornam um token JWT
  contendo `{ id, nome, papel }`.
- O front envia esse token em `Authorization: Bearer <token>` (interceptor do
  axios em `src/services/api.js`).
- `src/middlewares/auth.js` expõe `authMiddleware` (valida o token) e
  `requireRole(...papeis)` (autorização por perfil: `ADMIN`, `TECNICO`,
  `SOLICITANTE`), aplicados nas rotas de cada recurso.

## Como o CORS funciona aqui

Como o front (porta 5173) e o back (porta 3000) são origens diferentes, o
navegador bloquearia as requisições por padrão. A solução está **no
backend** (`src/app.js`), não em proxy ou extensão de navegador:

```js
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
```

`CORS_ORIGIN` no `.env` aponta explicitamente para `http://localhost:5173`.
Em produção, esse valor muda para o domínio real do front.

## Rotas principais

```
POST   /auth/login | /auth/registro
GET    /usuarios/me
GET|POST|PUT|DELETE  /usuarios | /departamentos | /categorias | /prioridades | /equipamentos
GET|POST|PUT|DELETE  /tickets
PATCH  /tickets/:id/status | /tickets/:id/atribuir
GET|POST|PUT|DELETE  /tickets/:id/comentarios
GET|POST|PUT|DELETE  /base-conhecimento
```

## Produção (documentação — não implementado neste repositório)

**PM2** mantém o processo Node vivo, reiniciando em caso de crash:

```bash
npm install -g pm2
pm2 start server.js --name servicedesk-api
pm2 list
pm2 logs servicedesk-api
pm2 restart servicedesk-api
```

**Nginx** como proxy reverso na frente do PM2, servindo o build estático do
React e terminando SSL:

```nginx
server {
    listen 443 ssl;
    server_name servicedesk.exemplo.com;

    root /var/www/servicedesk-frontend/dist;   # build do `npm run build`
    try_files $uri /index.html;                # SPA fallback

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Por que não expor a porta 3000 diretamente: o Nginx centraliza TLS/SSL (o
Node não precisa lidar com certificados), serve o front estático com
cache/gzip mais eficiente que o Express, expõe só as portas 80/443 ao
público — escondendo a topologia interna — e permite trocar/escalar a API
por trás do mesmo domínio sem o cliente perceber.
