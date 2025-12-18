import fetch from "node-fetch";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;
const MAX_VOTOS = 10;
const SUSPICION_SCORE = 6;

const memory = new Map(); // IP/session em produção → Redis ou KV

export async function securityCheck(req) {
  const ip = req.headers["x-forwarded-for"] || "local";

  const data = memory.get(ip) || {
    votos: 0,
    suspeita: 0,
    captcha: false,
    recaptcha: false
  };

  data.votos++;

  // Regra dos 10 votos
  if (data.votos >= MAX_VOTOS) {
    data.captcha = true;
  }

  // Suspeita alta → força reCAPTCHA
  if (data.suspeita >= SUSPICION_SCORE) {
    data.recaptcha = true;
  }

  memory.set(ip, data);

  return data;
}

export async function verifyRecaptcha(token, ip) {
  const res = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}&remoteip=${ip}`
    }
  );

  const data = await res.json();

  return data.success && data.score > 0.5;
}

export function resetSecurity(ip) {
  memory.delete(ip);
}
