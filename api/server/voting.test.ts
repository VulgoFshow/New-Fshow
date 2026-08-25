import express from "express";
import { createServer, type Server } from "node:http";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ENV } from "./_core/env";
import { registerVotingRoutes, votingInternals } from "./voting";

let server: Server;
let baseUrl = "";

beforeEach(async () => {
  votingInternals.challenges.clear();
  votingInternals.verifications.clear();
  votingInternals.attempts.clear();
  const app = express();
  app.use(express.json());
  registerVotingRoutes(app);
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Servidor de teste indisponível");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); });

describe("voting API", () => {
  it("emite um desafio sem revelar a resposta e aceita somente a seleção correta", async () => {
    const challengeResponse = await fetch(`${baseUrl}/api/voting/captcha`);
    const challenge = await challengeResponse.json();
    expect(challenge.ok).toBe(true);
    expect(challenge.images[0]).not.toHaveProperty("correct");

    const stored = votingInternals.challenges.get(challenge.challengeId);
    expect(stored).toBeDefined();
    const wrong = await fetch(`${baseUrl}/api/voting/captcha/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: challenge.challengeId, selectedIds: ["invalid"] }) });
    expect(wrong.status).toBe(400);
    expect(votingInternals.challenges.has(challenge.challengeId)).toBe(false);
  });

  it("emite token de uso único para uma solução correta", async () => {
    const challenge = await (await fetch(`${baseUrl}/api/voting/captcha`)).json();
    const stored = votingInternals.challenges.get(challenge.challengeId)!;
    const selectedIds = Array.from(stored.correctIds);
    const verified = await fetch(`${baseUrl}/api/voting/captcha/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: challenge.challengeId, selectedIds }) });
    const body = await verified.json();
    expect(verified.status).toBe(200);
    expect(body.verificationToken).toBeTruthy();
    expect(votingInternals.verifications.has(body.verificationToken)).toBe(true);
  });

  it("recusa participante inválido e token expirado com resposta genérica", async () => {
    const invalidParticipant = await fetch(`${baseUrl}/api/voting/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ participant: "Desconhecido", verificationToken: "fake-token" }) });
    expect(invalidParticipant.status).toBe(400);
    expect(await invalidParticipant.json()).toEqual({ ok: false, error: "Não foi possível concluir a solicitação." });

    const challenge = await (await fetch(`${baseUrl}/api/voting/captcha`)).json();
    const stored = votingInternals.challenges.get(challenge.challengeId)!;
    const verified = await fetch(`${baseUrl}/api/voting/captcha/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: challenge.challengeId, selectedIds: Array.from(stored.correctIds) }) });
    const { verificationToken } = await verified.json();
    votingInternals.verifications.get(verificationToken).expiresAt = Date.now() - 1;
    const expired = await fetch(`${baseUrl}/api/voting/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ participant: "João", verificationToken }) });
    expect(expired.status).toBe(400);
  });

  it("registra voto válido sem expor a chamada ao Supabase ao cliente", async () => {
    const challenge = await (await fetch(`${baseUrl}/api/voting/captcha`)).json();
    const stored = votingInternals.challenges.get(challenge.challengeId)!;
    const verificationToken = "valid-token";
    const ip = stored.ip;
    votingInternals.verifications.set(verificationToken, { ip, expiresAt: Date.now() + 60_000 });
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      if (String(input).includes("/rest/v1/")) return Promise.resolve(new Response(null, { status: 201 }));
      return originalFetch(input, init);
    });
    const response = await fetch(`${baseUrl}/api/voting/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ participant: "João", verificationToken }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("/rest/v1/"), expect.objectContaining({ method: "POST" }));
    fetchSpy.mockRestore();
  });

  it("recusa voto fora da janela de votação", async () => {
    const previousEnd = ENV.votingEnd;
    ENV.votingEnd = "2000-01-01T00:00:00Z";
    votingInternals.verifications.set("window-token", { ip: "unknown", expiresAt: Date.now() + 60_000 });
    const response = await fetch(`${baseUrl}/api/voting/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ participant: "João", verificationToken: "window-token" }) });
    ENV.votingEnd = previousEnd;
    expect(response.status).toBe(400);
  });

  it("bloqueia excesso de tentativas da mesma origem", async () => {
    const responses = await Promise.all(Array.from({ length: 25 }, () => fetch(`${baseUrl}/api/voting/captcha`)));
    expect(responses.some((response) => response.status === 429)).toBe(true);
  });
});
