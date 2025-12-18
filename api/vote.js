import { createClient } from "@supabase/supabase-js";
import { CAPTCHA_STORE, hash } from "./captcha";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// 🔐 Rate limit simples por IP
const RATE_LIMIT = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const data = RATE_LIMIT.get(ip) || { count: 0, time: now };

  if (now - data.time > 60_000) {
    RATE_LIMIT.set(ip, { count: 1, time: now });
    return false;
  }

  data.count++;
  RATE_LIMIT.set(ip, data);

  return data.count > 10;
}

function calcScore(s) {
  let score = 0;
  if (!s) return 10;
  if (s.tempo < 2500) score += 3;
  if (s.movimentos < 8) score += 2;
  if (s.scrolls === 0) score += 1;
  if (s.mudouAba) score += 1;
  return score;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ redirect: "/fechada.html" });
  }

  const {
    participante,
    table,
    encerramento, 
    captchaId,
    selectedTag,
    behavior
  } = req.body;

  if (!encerramento || new Date() > new Date(encerramento)) {
    return res.status(403).json({ redirect: "/fechada.html" });
  }

  if (!participante || !table) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const score = calcScore(behavior);

  if (score >= 4) {
    if (!captchaId || !selectedTag) {
      return res.status(401).json({ error: "captcha_required" });
    }

    const data = CAPTCHA_STORE.get(captchaId);

    if (
      !data ||
      data.used ||
      Date.now() > data.expires ||
      hash(selectedTag) !== data.answerHash
    ) {
      return res.status(401).json({ error: "captcha_invalid" });
    }

    data.used = true;
  }

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
    return res.status(500).json({ error: "Erro ao salvar voto" });
  }

  res.json({ success: true });
}
