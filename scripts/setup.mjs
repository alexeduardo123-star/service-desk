// Prepara o projeto do zero depois de um `git clone`:
// sobe o PostgreSQL no Docker, cria o backend/.env, instala as dependências,
// cria as tabelas e popula os dados de teste. Pode ser rodado de novo sem
// problema (não duplica nada).
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const backend = join(raiz, "backend");
const frontend = join(raiz, "frontend");

function passo(msg) {
  console.log(`\n==> ${msg}`);
}

function falhar(msg) {
  console.error(`\n[ERRO] ${msg}\n`);
  process.exit(1);
}

function rodar(cmd, cwd = raiz) {
  execSync(cmd, { cwd, stdio: "inherit" });
}

function funciona(cmd) {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// O Vite 8 exige Node 20.19+.
const [maior, menor] = process.versions.node.split(".").map(Number);
if (maior < 20 || (maior === 20 && menor < 19)) {
  falhar(`Node ${process.versions.node} é antigo demais. Instale o Node 22 LTS (https://nodejs.org).`);
}

passo("Verificando o Docker");
if (!funciona("docker compose version")) {
  falhar("Docker não encontrado. Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/");
}
if (!funciona("docker info")) {
  falhar("O Docker está instalado mas não está rodando. Abra o Docker Desktop, espere ele iniciar e rode de novo.");
}

// Porta alternativa (quando já existe outro PostgreSQL na 5432): fica salva
// no .env da raiz, que o docker compose lê sozinho em toda execução.
const porta = process.env.DB_PORT;
if (porta) writeFileSync(join(raiz, ".env"), `DB_PORT=${porta}\n`);

passo("Subindo o PostgreSQL (docker compose)");
try {
  rodar("docker compose up -d --wait");
} catch {
  falhar(
    `Não foi possível subir o banco. Se a mensagem acima fala de porta em uso ("port is already allocated" / "address already in use"), ` +
      `já existe outro PostgreSQL na porta ${porta || "5432"}. Pare esse outro serviço ` +
      `(Windows: services.msc > postgresql > Parar) ou use outra porta:\n` +
      `  PowerShell:  $env:DB_PORT=5433; npm run setup\n` +
      `  Git Bash:    DB_PORT=5433 npm run setup`
  );
}

passo("Criando backend/.env");
const envPath = join(backend, ".env");
if (existsSync(envPath) && !porta) {
  console.log("backend/.env já existe, mantendo o atual.");
} else {
  if (!existsSync(envPath)) copyFileSync(join(backend, ".env.example"), envPath);
  if (porta) {
    const env = readFileSync(envPath, "utf8").replace(/@localhost:\d+\//, `@localhost:${porta}/`);
    writeFileSync(envPath, env);
  }
  console.log(`backend/.env pronto${porta ? ` (banco na porta ${porta})` : ""}.`);
}

passo("Instalando dependências do backend");
rodar("npm install", backend);

passo("Instalando dependências do frontend");
rodar("npm install", frontend);

passo("Criando as tabelas (prisma migrate deploy)");
rodar("npx prisma migrate deploy", backend);
try {
  rodar("npx prisma generate", backend);
} catch {
  falhar(
    "Falha ao gerar o Prisma Client. Se apareceu EPERM acima, o backend ainda está rodando " +
      "(ele trava o arquivo do Prisma). Feche o `npm run dev` (Ctrl+C) e rode `npm run setup` de novo."
  );
}

passo("Populando dados de teste (seed)");
rodar("node prisma/seed.js", backend);

console.log(`
Pronto! Agora rode:

  npm run dev

e acesse http://localhost:5173
Login: admin@servicedesk.com / 123456
`);
