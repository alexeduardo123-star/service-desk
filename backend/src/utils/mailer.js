import nodemailer from "nodemailer";

// Reaproveita o mesmo transporter entre requisições em vez de recriar a cada
// envio. Se não houver SMTP configurado no .env, cai para um modo de
// desenvolvimento que apenas loga o email no console — assim o fluxo de
// "esqueci minha senha" funciona localmente mesmo sem credenciais reais.
let transporterPromise;

function criarTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
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
    "[mailer] SMTP não configurado (.env). Emails serão apenas exibidos no console."
  );
  return Promise.resolve(null);
}

async function getTransporter() {
  if (!transporterPromise) transporterPromise = criarTransporter();
  return transporterPromise;
}

export async function enviarEmail({ to, subject, html, text }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || "Service Desk <naoresponda@servicedesk.local>";

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
