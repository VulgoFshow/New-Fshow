import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";

const participants = new Set(["João", "Lívia", "Ludmila"]);

type CaptchaImage = { id: string; src: string; alt: string };
type Challenge = {
  prompt: string;
  images: CaptchaImage[];
  correctIds: Set<string>;
  expiresAt: number;
  ip: string;
};
type Verification = { expiresAt: number; ip: string };
type Attempt = { count: number; resetAt: number };

const prompts = [
  {
    prompt: "Selecione todas as imagens que podem se locomover",
    correct: ["car", "car2", "moto1"],
    images: [
      ["car", "https://i.postimg.cc/DwJSK9qP/car1v2.jpg", "Carro"],
      ["paper", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/papel-higi%C3%AAnico.jpg?raw=true", "Papel"],
      ["car2", "https://i.postimg.cc/Sx2npBWV/car2v2.png", "Carro"],
      ["soap", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/sabonete.jpg?raw=true", "Sabonete"],
      ["moto1", "https://i.postimg.cc/FHdYQMjD/moto1v2.png", "Moto"],
      ["towel", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/toalha.jpg?raw=true", "Toalha"],
    ],
  },
  {
    prompt: "Selecione todas as imagens usadas para higiene",
    correct: ["soap", "towel", "paper"],
    images: [
      ["soap", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/sabonete.jpg?raw=true", "Sabonete"],
      ["car", "https://i.postimg.cc/DwJSK9qP/car1v2.jpg", "Carro"],
      ["towel", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/toalha.jpg?raw=true", "Toalha"],
      ["car2", "https://i.postimg.cc/Sx2npBWV/car2v2.png", "Carro"],
      ["paper", "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/papel-higi%C3%AAnico.jpg?raw=true", "Papel"],
      ["moto1", "https://i.postimg.cc/FHdYQMjD/moto1v2.png", "Moto"],
    ],
  },
].map((item) => ({
  ...item,
  images: item.images.map(([id, src, alt]) => ({ id, src, alt })),
}));

const challenges = new Map<string, Challenge>();
const verifications = new Map<string, Verification>();
const attempts = new Map<string, Attempt>();

function clientIp(req: Request) {
  return (req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "unknown").slice(0, 80);
}

function allowAttempt(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + ENV.rateLimitWindowMs });
    return true;
  }
  if (current.count >= ENV.rateLimitMax) return false;
  current.count += 1;
  return true;
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of Array.from(challenges.entries())) if (value.expiresAt <= now) challenges.delete(key);
  for (const [key, value] of Array.from(verifications.entries())) if (value.expiresAt <= now) verifications.delete(key);
  for (const [key, value] of Array.from(attempts.entries())) if (value.resetAt <= now) attempts.delete(key);
}

function publicError(res: Response, status = 400) {
  return res.status(status).json({ ok: false, error: "Não foi possível concluir a solicitação." });
}

export function registerVotingRoutes(app: Express) {
  app.get("/api/voting/captcha", (req, res) => {
    cleanExpired();
    const ip = clientIp(req);
    if (!allowAttempt(ip)) return publicError(res, 429);
    const selected = prompts[Math.floor(Math.random() * prompts.length)]!;
    const id = crypto.randomUUID();
    challenges.set(id, {
      prompt: selected.prompt,
      images: selected.images,
      correctIds: new Set(selected.correct),
      expiresAt: Date.now() + ENV.challengeTtlMs,
      ip,
    });
    return res.json({
      ok: true,
      challengeId: id,
      prompt: selected.prompt,
      images: selected.images,
      expiresInMs: ENV.challengeTtlMs,
    });
  });

  app.post("/api/voting/captcha/verify", (req, res) => {
    cleanExpired();
    const ip = clientIp(req);
    if (!allowAttempt(ip)) return publicError(res, 429);
    const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId : "";
    const selectedIds = Array.isArray(req.body?.selectedIds) ? req.body.selectedIds.filter((id: unknown): id is string => typeof id === "string") : [];
    const challenge = challenges.get(challengeId);
    challenges.delete(challengeId);
    if (!challenge || challenge.ip !== ip || challenge.expiresAt <= Date.now()) return publicError(res);
    const expected = Array.from(challenge.correctIds).sort();
    const received = Array.from(new Set(selectedIds)).sort();
    if (expected.length !== received.length || expected.some((id, index) => id !== received[index])) return publicError(res);
    const verificationToken = crypto.randomUUID();
    verifications.set(verificationToken, { ip, expiresAt: Date.now() + ENV.challengeTtlMs });
    return res.json({ ok: true, verificationToken, expiresInMs: ENV.challengeTtlMs });
  });

  app.post("/api/voting/vote", async (req, res) => {
    cleanExpired();
    const ip = clientIp(req);
    if (!allowAttempt(ip)) return publicError(res, 429);
    const participant = typeof req.body?.participant === "string" ? req.body.participant.trim() : "";
    const verificationToken = typeof req.body?.verificationToken === "string" ? req.body.verificationToken : "";
    const verification = verifications.get(verificationToken);
    verifications.delete(verificationToken);
    const now = Date.now();
    const start = Date.parse(ENV.votingStart);
    const end = Date.parse(ENV.votingEnd);
    if (!participants.has(participant) || !verification || verification.ip !== ip || verification.expiresAt <= now || now < start || now > end) return publicError(res);
    if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(ENV.votingTable)) return publicError(res, 503);

    const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${encodeURIComponent(ENV.votingTable)}`, {
      method: "POST",
      headers: {
        apikey: ENV.supabaseServiceRoleKey,
        Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(Array.from({ length: Math.max(1, ENV.votesPerCaptcha) }, () => ({ participante: participant }))),
    });
    if (!response.ok) return publicError(res, 503);
    return res.json({ ok: true });
  });
}

export const votingInternals = { challenges, verifications, attempts, participants };
