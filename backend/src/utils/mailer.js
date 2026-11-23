import nodemailer from "nodemailer";

// Reaproveita o mesmo transporter entre requisições em vez de recriar a cada
// envio. Se não houver SMTP configurado no .env, cai para um modo de
// desenvolvimento que apenas loga o email no console — assim os fluxos de
// confirmação de cadastro e "esqueci minha senha" funcionam localmente mesmo
// sem credenciais reais.
//
// Atenção: o backend/.env NÃO vai para o Git. Cada pessoa que roda o projeto
// precisa preencher o SMTP no próprio .env para que os emails saiam de verdade.
let transporterPromise;

export function emailConfigurado() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

// Complemento das mensagens das telas quando o email não sai de verdade, para
// ninguém ficar esperando um email que nunca vai chegar.
export const AVISO_EMAIL_DEV =
  " Atenção: o envio de email não está configurado neste servidor (backend/.env), " +
  "então o código foi exibido no terminal do backend.";

// Escapa texto digitado pelo usuário (ex.: nome) antes de colocá-lo no HTML.
export function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function criarTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (emailConfigurado()) {
    return Promise.resolve(
      nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    );
  }

  console.warn(
    "[mailer] SMTP não configurado no backend/.env. Os emails (códigos de cadastro e de senha) " +
      "serão apenas exibidos neste terminal. Veja a seção \"Envio de email\" no README."
  );
  return Promise.resolve(null);
}

async function getTransporter() {
  if (!transporterPromise) transporterPromise = criarTransporter();
  return transporterPromise;
}

export async function enviarEmail({ to, subject, html, text }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || "FlowDesk <naoresponda@flowdesk.local>";

  if (!transporter) {
    console.log("--------- EMAIL (modo dev, sem SMTP configurado) ---------");
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(text || html);
    console.log("------------------------------------------------------------");
    return;
  }

  await transporter.sendMail({ from, to, subject, html, text });
}
