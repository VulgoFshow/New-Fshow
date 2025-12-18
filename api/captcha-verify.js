import crypto from "crypto";
import { sessions } from "./captcha-generate";

export default function handler(req, res) {
  const { captchaId, selectedHashes } = req.body;

  if (!captchaId || !Array.isArray(selectedHashes)) {
    return res.status(400).json({ success: false });
  }

  const session = sessions.get(captchaId);
  if (!session) {
    return res.status(400).json({ success: false });
  }

  const { correctTag, expires } = session;

  if (Date.now() > expires) {
    sessions.delete(captchaId);
    return res.status(400).json({ success: false });
  }

  const correctHash = crypto
    .createHash("sha256")
    .update(correctTag + captchaId)
    .digest("hex");

  const success =
    selectedHashes.length > 0 &&
    selectedHashes.every(hash => hash === correctHash);

  sessions.delete(captchaId);

  res.json({ success });
}
