import crypto from "crypto";
import { CAPTCHA_PROMPTS } from "./captcha-data";

const sessions = new Map();

export default function handler(req, res) {
  const prompt =
    CAPTCHA_PROMPTS[Math.floor(Math.random() * CAPTCHA_PROMPTS.length)];

  const captchaId = crypto.randomUUID();

  const shuffledImages = [...prompt.images].sort(
    () => Math.random() - 0.5
  );

  sessions.set(captchaId, {
    correctTag: prompt.correctTag,
    expires: Date.now() + 2 * 60 * 1000 // 2 minutos
  });

  res.json({
    captchaId,
    label: prompt.label,
    images: shuffledImages.map(img => ({
      src: img.src,
      hash: crypto
        .createHash("sha256")
        .update(img.tag + captchaId)
        .digest("hex")
    }))
  });
}

export { sessions };
