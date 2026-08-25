import { randomUUID } from "node:crypto";

type CaptchaImage = { id: string; src: string; alt: string };
type Challenge = { prompt: string; images: CaptchaImage[]; correctIds: string[]; ip: string; expiresAt: number };
type Verification = { ip: string; expiresAt: number };
type Attempt = { count: number; resetAt: number };

const participants = new Set(["João", "Lívia", "Ludmila"]);
const challenges = new Map<string, Challenge>();
const verifications = new Map<string, Verification>();
const attempts = new Map<string, Attempt>();

const challengeTtl = () => Number(process.env.CAPTCHA_CHALLENGE_TTL_MS ?? "180000");
const rateLimitWindow = () => Number(process.env.VOTING_RATE_LIMIT_WINDOW_MS ?? "60000");
const rateLimitMax = () => Number(process.env.VOTING_RATE_LIMIT_MAX ?? "20");

const prompts = [
  {
    prompt: "Clique nas imagens contendo algo que pode se locomover",
    correctIds: ["car-1", "car-2", "moto-1", "moto-2"],
    images: [
      ["car-1", "https://i.postimg.cc/DwJSK9qP/car1v2.jpg", "Carro"],
      ["car-2", "https://i.postimg.cc/Sx2npBWV/car2v2.png", "Carro"],
      ["moto-1", "https://i.postimg.cc/FHdYQMjD/moto1v2.png", "Moto"],
      ["moto-2", "https://i.postimg.cc/T3LKXzrq/moto2v2.jpg", "Moto"],
      ["dryer", "https://i.postimg.cc/6QV5WtTH/secador.jpg", "Secador"],
      ["paper", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/papel-higi%C3%AAnico.jpg?raw=true", "Papel higiênico"],
      ["towel", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/toalha.jpg?raw=true", "Toalha"],
      ["soap", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/sabonete.jpg?raw=true", "Sabonete"],
      ["brush", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/escova-de-dentes.jpg?raw=true", "Escova de dentes"],
    ],
  },
  {
    prompt: "Clique nas imagens contendo um animal",
    correctIds: ["elephant", "horse", "lion", "rhino"],
    images: [
      ["elephant", "https://i.ibb.co/PZPW0gzR/elefante.jpg", "Elefante"],
      ["horse", "https://i.ibb.co/zHZ6BhsR/cavalo.jpg", "Cavalo"],
      ["lion", "https://i.ibb.co/Nw9HKGp/leao.jpg", "Leão"],
      ["rhino", "https://i.ibb.co/VcBzNJsw/rino.jpg", "Rinoceronte"],
      ["cereals", "https://i.postimg.cc/x8Dwcb7X/cereais.png", "Cereais"],
      ["pie", "https://i.ibb.co/WNh2CsLC/torta.png", "Torta"],
      ["cookie", "https://i.ibb.co/BHvGC4Cr/cookie.png", "Cookie"],
      ["cake", "https://i.postimg.cc/d3PbLTX7/bolo.png", "Bolo"],
    ],
  },
].map((prompt) => ({
  ...prompt,
  images: prompt.images.map(([id, src, alt]) => ({ id, src, alt })),
}));

function ipFrom(request: Request) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown").slice(0, 80);
}

function cleanExpired(now = Date.now()) {
  for (const [key, value] of Array.from(challenges.entries())) if (value.expiresAt <= now) challenges.delete(key);
  for (const [key, value] of Array.from(verifications.entries())) if (value.expiresAt <= now) verifications.delete(key);
  for (const [key, value] of Array.from(attempts.entries())) if (value.resetAt <= now) attempts.delete(key);
}

function allowed(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + rateLimitWindow() });
    return true;
  }
  if (current.count >= rateLimitMax()) return false;
  current.count += 1;
  return true;
}

function failure(status = 400) {
  return Response.json({ ok: false, error: "Não foi possível concluir a solicitação." }, { status });
}

async function jsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function createCaptchaChallenge(request: Request) {
  cleanExpired();
  const ip = ipFrom(request);
  if (!allowed(ip)) return failure(429);
  const selected = prompts[Math.floor(Math.random() * prompts.length)]!;
  const challengeId = randomUUID();
  challenges.set(challengeId, {
    prompt: selected.prompt,
    images: selected.images,
    correctIds: selected.correctIds,
    ip,
    expiresAt: Date.now() + challengeTtl(),
  });
  return Response.json({ ok: true, challengeId, prompt: selected.prompt, images: selected.images, expiresInMs: challengeTtl() }, { headers: { "Cache-Control": "no-store" } });
}

export async function verifyCaptchaChallenge(request: Request) {
  cleanExpired();
  const ip = ipFrom(request);
  if (!allowed(ip)) return failure(429);
  const body = await jsonBody(request);
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId : "";
  const selectedIds = Array.isArray(body?.selectedIds) ? body.selectedIds.filter((value): value is string => typeof value === "string") : [];
  const challenge = challenges.get(challengeId);
  challenges.delete(challengeId);
  if (!challenge || challenge.ip !== ip || challenge.expiresAt <= Date.now()) return failure();
  const expected = [...challenge.correctIds].sort();
  const received = [...new Set(selectedIds)].sort();
  if (expected.length !== received.length || expected.some((id, index) => id !== received[index])) return failure();
  const verificationToken = randomUUID();
  verifications.set(verificationToken, { ip, expiresAt: Date.now() + challengeTtl() });
  return Response.json({ ok: true, verificationToken, expiresInMs: challengeTtl() }, { headers: { "Cache-Control": "no-store" } });
}

export async function submitVote(request: Request) {
  cleanExpired();
  const ip = ipFrom(request);
  if (!allowed(ip)) return failure(429);
  const body = await jsonBody(request);
  const participant = typeof body?.participant === "string" ? body.participant.trim() : "";
  const verificationToken = typeof body?.verificationToken === "string" ? body.verificationToken : "";
  const verification = verifications.get(verificationToken);
  verifications.delete(verificationToken);
  const now = Date.now();
  const start = Date.parse(process.env.VOTATION_START ?? "2026-01-18T19:00:00-03:00");
  const end = Date.parse(process.env.VOTATION_END ?? "2026-08-25T19:00:00-03:00");
  if (!participants.has(participant) || !verification || verification.ip !== ip || verification.expiresAt <= now || now < start || now > end) return failure();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.VOTATION_TABLE;
  if (!supabaseUrl || !serviceRoleKey || !table || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) return failure(503);
  const amount = Math.max(1, Number(process.env.VOTOS_POR_CAPTCHA ?? "10"));
  const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(Array.from({ length: amount }, () => ({ participante: participant }))),
  });
  if (!response.ok) return failure(503);
  return Response.json({ ok: true });
}

export const votingTestState = { challenges, verifications, attempts, participants };
