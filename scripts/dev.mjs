// Sobe o banco (se estiver parado), o backend e o frontend no mesmo terminal.
// Ctrl+C encerra tudo.
import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("docker compose up -d --wait", { cwd: raiz, stdio: "inherit" });
} catch {
  console.error("\n[ERRO] Não foi possível subir o banco. O Docker Desktop está aberto? Já rodou `npm run setup`?\n");
  process.exit(1);
}

// Depois de um `git pull` podem ter chegado migrations/dependências novas.
// Sem isso o banco fica desatualizado e o login quebra com
// "Invalid `prisma.usuario.findUnique()` invocation".
const backend = join(raiz, "backend");
if (!existsSync(join(backend, ".env"))) {
  console.error("\n[ERRO] backend/.env não existe. Rode `npm run setup` primeiro.\n");
  process.exit(1);
}
for (const pasta of ["backend", "frontend"]) {
  if (!existsSync(join(raiz, pasta, "node_modules"))) {
    console.log(`\n==> Instalando dependências do ${pasta}`);
    execSync("npm install", { cwd: join(raiz, pasta), stdio: "inherit" });
  }
}
try {
  console.log("\n==> Aplicando migrations pendentes (prisma migrate deploy)");
  execSync("npx prisma migrate deploy", { cwd: backend, stdio: "inherit" });
} catch {
  console.error(
    "\n[ERRO] Não foi possível atualizar o banco. Se a mensagem acima for de conexão/autenticação, " +
      "provavelmente existe outro PostgreSQL na porta do .env respondendo no lugar do Docker. " +
      "Rode `npm run setup` para diagnosticar.\n"
  );
  process.exit(1);
}
try {
  execSync("npx prisma generate", { cwd: backend, stdio: "inherit" });
} catch {
  console.error(
    "\n[ERRO] Falha ao gerar o Prisma Client. Se apareceu EPERM, ainda há um backend antigo rodando " +
      "(feche-o ou reinicie o terminal) e rode `npm run dev` de novo.\n"
  );
  process.exit(1);
}

const processos = [];

function iniciar(nome, cor, pasta) {
  const prefixo = `\x1b[${cor}m[${nome}]\x1b[0m `;
  const filho = spawn("npm", ["run", "dev"], { cwd: join(raiz, pasta), shell: true });
  const escrever = (saida) => (dados) => {
    for (const linha of dados.toString().split(/\r?\n/)) {
      if (linha) saida.write(prefixo + linha + "\n");
    }
  };
  filho.stdout.on("data", escrever(process.stdout));
  filho.stderr.on("data", escrever(process.stderr));
  filho.on("exit", (codigo) => {
    console.log(`${prefixo}encerrado (código ${codigo})`);
    encerrar();
  });
  processos.push(filho);
}

let encerrando = false;
function encerrar() {
  if (encerrando) return;
  encerrando = true;
  for (const p of processos) {
    // No Windows o kill() só encerra o cmd.exe do shell, deixando o
    // nodemon/vite órfãos (e o motor do Prisma travado); mata a árvore toda.
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /pid ${p.pid} /T /F`, { stdio: "ignore" });
      } catch {
        // processo já tinha encerrado
      }
    } else {
      p.kill();
    }
  }
  process.exit();
}

process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);

iniciar("backend", 36, "backend");
iniciar("frontend", 35, "frontend");
