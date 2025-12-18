import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES_PERMITIDAS = ["f3roça10", "f3roça12", "f3roça13", "f3roça14", "f3roça15", "f3roça16", "testes", "f3roça11"];

async function verificarRecaptcha(token) {
  const res = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${token}`
    }
  );

  const data = await res.json();
  return data.success && data.score >= 0.5;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Acesso negado" });
  }

  const { participante, table, captchaOk, recaptchaToken } = req.body;

  if (!participante || !table) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  if (!TABLES_PERMITIDAS.includes(table)) {
      return res.status(403).json({ error: "Houve um erro no banco de dados" });
  }

  if (!captchaOk) {
    return res.status(403).json({ error: "Captcha não resolvido" });
  }

  if (recaptchaToken) {
    const valido = await verificarRecaptcha(recaptchaToken);
    if (!valido) {
      return res.status(403).json({ error: "reCAPTCHA inválido" });
    }
  }

  const { error } = await supabase
    .from(table)
    .insert([{ participante }]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao salvar voto" });
  }

  return res.status(200).json({ success: true });
}
