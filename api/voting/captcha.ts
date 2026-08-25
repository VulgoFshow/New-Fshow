import { createCaptchaChallenge } from "../../lib/voting";

export async function GET(request: Request) {
  return createCaptchaChallenge(request);
}

export async function POST() {
  return Response.json(
    { ok: false, error: "Não foi possível concluir a solicitação." },
    { status: 405 },
  );
}
