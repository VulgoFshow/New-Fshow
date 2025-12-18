import { CAPTCHA_STORE, hash } from "./captcha";

export default function handler(req, res) {
  const { captchaId, selectedTag } = req.body;

  const data = CAPTCHA_STORE.get(captchaId);
  if (!data || data.used) return res.status(403).json({ error: "Inválido" });

  if (Date.now() > data.expires) return res.status(410).json({ error: "Expirado" });

  data.used = true;

  if (hash(selectedTag) !== data.answerHash) {
    return res.status(401).json({ error: "Captcha incorreto" });
  }

  res.json({ success: true });
}
