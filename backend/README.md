# Service Desk — Backend (API)

Sistema de chamados/tickets de suporte técnico. Esta pasta é a API
(Node.js + Express + PostgreSQL); o front-end (React + Vite) fica em
`../frontend/` deste mesmo repositório.

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

Alternativas ao `prisma migrate dev`, entregues para fins de avaliação da
disciplina (a API em si continua rodando sobre o Prisma Client):

- **SQL puro**: `psql -U servicedesk_user -d servicedesk -f sql/schema.sql`
  cria as tabelas diretamente, sem ORM.
- **Sequelize CLI**: `npx sequelize-cli db:migrate` cria as mesmas tabelas via
  `migrations/` (ver seção própria abaixo).

As três formas (Prisma Migrate, SQL puro, Sequelize CLI) resultam num schema
equivalente — validado comparando o `pg_dump --schema-only` de bancos de
teste criados por cada uma.

Usuários de teste (senha `123456` para todos):
- `admin@servicedesk.com` (ADMIN)
- `tecnico@servicedesk.com` (TECNICO)
- `usuario@servicedesk.com` (SOLICITANTE)

### 3. Frontend

```bash
cd ../frontend
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

## Sequelize CLI (migrations — pedido pelo professor)

A API continua rodando sobre o **Prisma Client** (controllers, queries,
`server.js`) — o Sequelize aqui entra só como ferramenta de migrations,
demonstrando as mesmas 8 tabelas + os 2 ALTER TABLE de `usuarios`
(verificação de email e recuperação de senha) no formato do `sequelize-cli`,
sem duplicar a camada de acesso a dados da aplicação.

> ⚠️ **Não rode isso contra o banco `servicedesk` que a API usa.** Rode num
> banco separado, só pra essa demonstração:
>
> ```bash
> sudo -u postgres createdb servicedesk_sequelize -O servicedesk_user
> cd backend
> DATABASE_URL="postgresql://servicedesk_user:servicedesk_pw@localhost:5432/servicedesk_sequelize" npx sequelize-cli db:migrate
> DATABASE_URL="postgresql://servicedesk_user:servicedesk_pw@localhost:5432/servicedesk_sequelize" npx sequelize-cli db:migrate:status
> DATABASE_URL="postgresql://servicedesk_user:servicedesk_pw@localhost:5432/servicedesk_sequelize" npx sequelize-cli db:migrate:undo:all
> ```
>
> Se rodar sem o `DATABASE_URL=...` na frente, ele usa o `.env` normal — ou
> seja, o banco real da API. **Cuidado**: `queryInterface.createTable` do
> Sequelize gera `CREATE TABLE IF NOT EXISTS`, então se as tabelas já
> existirem (caso do banco real, criado pelo Prisma) ele **não dá erro** —
> ignora a criação silenciosamente e segue pros próximos passos da migration
> (índices, `ADD COLUMN`), que aí sim executam de verdade contra as tabelas
> reais. A migration inicial (`migrations/20260812224822-*.cjs`) tem uma
> trava no início (`tableExists("departamentos")`) que barra a execução com
> um erro claro se detectar que já existe schema no banco alvo — mas só
> funciona se você começar por ela; rodar `db:migrate` a partir de um estado
> onde só a migration 1 já foi (erroneamente) marcada como aplicada pula
> essa trava. Se acontecer de novo: `DROP TABLE "SequelizeMeta";` no banco
> real e confira `\d tickets`/`\d usuarios` no psql — se sobrou algum índice
> extra (`idx_tickets_*`, `idx_comentarios_ticket`) ou coluna que não devia,
> derruba com `DROP INDEX`/`ALTER TABLE ... DROP COLUMN`.

- Usa a mesma `DATABASE_URL` do `.env` (ver `config/config.cjs`) quando
  apontada pra um banco próprio como acima — não precisa configurar
  credenciais separadas, só o nome do banco.
- `migrations/` tem uma migration por migration do Prisma (mesmo timestamp no
  nome, pra ficar fácil de comparar uma com a outra):
  `20260812224822` (schema inicial) → `20260831201500` (verificação de email)
  → `20260831223923` (recuperação de senha).
- Diferenças esperadas em relação ao schema do Prisma (cosméticas, não
  afetam a estrutura): o Sequelize cria um tipo ENUM por coluna
  (`enum_usuarios_papel`, `enum_tickets_status`) em vez de tipos nomeados
  compartilhados (`PapelUsuario`, `StatusTicket`), usa `TIMESTAMP WITH TIME
  ZONE` em vez de `TIMESTAMP(3)`, e nomeia as constraints de forma diferente.
  Validado rodando as migrations num banco de teste à parte e comparando o
  `pg_dump --schema-only` com o gerado pelo Prisma.
- Não há `models/` — como só as migrations foram pedidas, não existe uma
  segunda camada Sequelize de acesso a dados coexistindo com o Prisma Client.

## Autenticação (JWT)

- `POST /auth/login` e `POST /auth/registro` (público) retornam um token JWT
  contendo `{ id, nome, papel }`. Qualquer pessoa pode se cadastrar por
  `/auth/registro` (perfil `SOLICITANTE` por padrão).
- O front envia esse token em `Authorization: Bearer <token>` (interceptor do
  axios em `../frontend/src/services/api.js`).
- `src/middlewares/auth.js` expõe `authMiddleware` (valida o token) e
  `requireRole(...papeis)` (autorização por perfil: `ADMIN`, `TECNICO`,
  `SOLICITANTE`), aplicados nas rotas de cada recurso.

### Recuperação de senha (esqueci minha senha)

- `POST /auth/esqueci-senha` `{ email }` (público): se o email existir e
  estiver ativo, gera um código numérico de 6 dígitos, salva o hash dele
  (`usuarios.resetTokenHash`/`resetTokenExpiresAt`, expira em 15 min) e envia
  por email via `src/utils/mailer.js`. Sempre responde com a mesma mensagem
  genérica, exista ou não o email, para não revelar quais contas estão
  cadastradas.
- `POST /auth/redefinir-senha` `{ email, codigo, novaSenha }` (público):
  valida o código (compara hash) e a expiração, e caso válido atualiza
  `senhaHash` e limpa o token.
- Envio de email: configurável via `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/
  `SMTP_PASS`/`SMTP_FROM` no `.env`. Sem SMTP configurado, o email é apenas
  impresso no console do backend (modo desenvolvimento) — útil para testar o
  fluxo localmente sem uma conta de email real.

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
POST   /auth/login | /auth/registro | /auth/esqueci-senha | /auth/redefinir-senha
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
