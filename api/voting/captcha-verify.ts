import { verifyCaptchaChallenge } from "../../lib/voting";

export async function POST(request: Request) {
  return verifyCaptchaChallenge(request);
}
