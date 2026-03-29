import nodemailer from "nodemailer";

type EmailJobPayload = {
  to: string;
  subject: string;
  body?: string;
  textBody?: string;
  htmlBody?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parseSecureFlag(value: string | undefined) {
  if (!value) return undefined;
  return value === "1" || value.toLowerCase() === "true";
}

function createTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = requireEnv("SMTP_HOST");
  const portRaw = requireEnv("SMTP_PORT");
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid positive integer.");
  }

  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const secure = parseSecureFlag(process.env.SMTP_SECURE);

  console.log("Creating email transporter", { host, port, secure, user, pass });

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    service: "gmail",
    auth: { user, pass },
  });

  return cachedTransporter;
}

function resolveSenderAddress() {
  const fromEmail = requireEnv("FROM_EMAIL");
  const fromName = process.env.FROM_NAME?.trim();
  return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
}

export async function processEmailJob(data: EmailJobPayload) {
  if (!data.to?.trim()) {
    throw new Error("Email payload missing recipient address.");
  }
  if (!data.subject?.trim()) {
    throw new Error("Email payload missing subject.");
  }

  const text = data.textBody?.trim() || data.body?.trim();
  const html = data.htmlBody?.trim();
  if (!text && !html) {
    throw new Error("Email payload missing content.");
  }

  const transporter = createTransporter();
  const from = resolveSenderAddress();

  try {
    const info = await transporter.sendMail({
      from,
      to: data.to,
      subject: data.subject,
      text,
      html,
    });

    console.log("Email sent", {
      to: data.to,
      subject: data.subject,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email delivery failed", {
      to: data.to,
      subject: data.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Email delivery failed.");
  }
}
