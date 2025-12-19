import { createClient } from "@supabase/supabase-js";

/* =========================
   SUPABASE
========================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

/* =========================
   RATE LIMIT POR IP
========================= */
const RATE_LIMIT = new Map();
const LIMITE_POR_MINUTO = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const data = RATE_LIMIT.get(ip) || { count: 0, time: now };

  // reseta a cada 1 minuto
  if (now - data.time > 60_000) {
    RATE_LIMIT.set(ip, { count: 1, time: now });
    return false;
  }

  data.count++;
  RATE_LIMIT.set(ip, data);

  return data.count > LIMITE_POR_MINUTO;
}

/* =========================
   HANDLER
========================= */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    /* =========================
       IP DO USUÁRIO
    ========================= */
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    if (isRateLimited(ip)) {
      return res.status(429).json({
        error: "rate_limited",
        redirect: "/fechada.html"
      });
    }

    /* =========================
       BODY
    ========================= */
    const { participante, table } = req.body;

    if (!participante || !table) {
      return res.status(400).json({
        error: "Dados inválidos"
      });
    }

    /* =========================
       INSERÇÃO NO SUPABASE
    ========================= */
    const { error } = await supabase
      .from(table)
      .insert([
        {
          participante,
          ip,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({
        error: "Erro ao salvar voto"
      });
    }

    /* =========================
       SUCESSO
    ========================= */
    return res.status(200).json({
      success: true
    });

  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({
      error: "Erro interno"
    });
  }
}
