import crypto from "crypto";
import { CAPTCHA_PROMPTS } from "./prompts";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function handler(req, res) {
  const prompt = CAPTCHA_PROMPTS[
    Math.floor(Math.random() * CAPTCHA_PROMPTS.length)
  ];

  const images = shuffle(prompt.images).slice(0, 9);

  // Gera hash da resposta correta
  const solutionHash = crypto
    .createHash("sha256")
    .update(
      images
        .filter(i => i.tag === prompt.correctTag)
        .map(i => i.src)
        .sort()
        .join("|")
    )
    .digest("hex");

  // Token temporário (expira)
  const captchaId = crypto.randomUUID();

  res.status(200).json({
    captchaId,
    label: prompt.label,
    images: images.map(i => ({ src: i.src })),
    solutionHash
  });
}
