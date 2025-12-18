import { sessions } from "./captcha-generate";

export default function handler(req, res) {
  const { captchaId } = req.body;

  if (captchaId) {
    sessions.delete(captchaId);
  }

  res.json({ reset: true });
}
