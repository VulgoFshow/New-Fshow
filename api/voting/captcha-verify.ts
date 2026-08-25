import { verifyCaptchaChallenge } from "../../lib/voting";

export async function POST(request: Request) {
  return verifyCaptchaChallenge(request);
}

export async function GET() {
  return Response.json({ ok: false, error: "Não foi possível concluir a solicitação." }, { status: 405 });
}
