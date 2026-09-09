import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CAPTCHA_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const TABLE_VOTACAO = "bf7p3"; 

function decodificarToken(token) {
  if (typeof token !== "string" || !token.trim()) return null;
  const partes = token.split(":");
  if (partes.length !== 2) return null;

  try {
    const iv = Buffer.from(partes[0], "hex");
    const encrypted = Buffer.from(partes[1], "hex");
    if (iv.length !== 16 || encrypted.length === 0) return null;

    const chave = crypto.createHash("sha256").update(CAPTCHA_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", chave, iv);
    let texto = decipher.update(encrypted, undefined, "utf8");
    texto += decipher.final("utf8");

    return JSON.parse(texto);
  } catch (error) {
    return null;
  }
}

function mesmoConjunto(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const esperado = [...a].sort((x, y) => x - y);
  const recebido = [...b].sort((x, y) => x - y);
  return esperado.every((valor, indice) => valor === recebido[indice]);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body = req.body || {};
    const { action } = body;

    // Validar Captcha e criar seção
    if (action === "validar-captcha") {
      const captchaToken = String(body.captchaToken || "").trim();
      const selectedIds = body.selectedIds;

      if (!captchaToken || !Array.isArray(selectedIds)) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      const payload = decodificarToken(captchaToken);
      const expirado = !payload || (Date.now() - payload.createdAt > CAPTCHA_TTL_MS);

      if (expirado) {
        return res.status(400).json({ success: false, error: "CAPTCHA expirado ou inválido" });
      }

      if (!mesmoConjunto(selectedIds, payload.correctIds)) {
        return res.status(400).json({ success: false, error: "CAPTCHA incorreto" });
      }

      // Valodar Seção
      const expiresAt = new Date(Date.now() + CAPTCHA_TTL_MS).toISOString();
      const { error: sessionError } = await supabase
        .from("captcha_sessions")
        .insert([{ id: payload.captchaId, votos_restantes: 10, expires_at: expiresAt }]);

      if (sessionError) {
        console.error("Erro ao salvar sessão de captcha:", sessionError);
        return res.status(500).json({ error: "Erro ao registrar validação" });
      }

      return res.status(200).json({
        success: true,
        captchaSessionToken: captchaToken, // Comprovante
        votosLiberados: 10
      });
    }

    // REGISTROS 
    if (action === "votar") {
      const participante = String(body.participante || "").trim();
      const captchaToken = String(body.captchaToken || "").trim();

      if (!participante || !captchaToken) {
        return res.status(400).json({ error: "Voto negado: Validação de CAPTCHA ausente." });
      }

      // Decodificar Token
      const payload = decodificarToken(captchaToken);
      if (!payload || !payload.captchaId) {
        return res.status(403).json({ error: "Sessão de CAPTCHA inválida." });
      }

      // Ver votos
      const { data: session, error: sessError } = await supabase
        .from("captcha_sessions")
        .select("votos_restantes, expires_at")
        .eq("id", payload.captchaId)
        .single();

      if (sessError || !session) {
        return res.status(403).json({ error: "Sessão de votação não encontrada. Resolva o CAPTCHA." });
      }

      if (new Date(session.expires_at).getTime() < Date.now()) {
        return res.status(403).json({ error: "Sessão expirada. Resolva o CAPTCHA novamente." });
      }

      if (session.votos_restantes <= 0) {
        return res.status(403).json({ error: "Seus votos deste CAPTCHA acabaram. Resolva um novo." });
      }

      // Verificação horário
      const { data: controle } = await supabase
        .from("controle_votacao")
        .select("modo")
        .eq("id", 1)
        .single();

      if (controle?.modo === "fechada") {
        return res.status(403).json({ error: "A votação está fechada." });
      }

      // Votou
      await supabase
        .from("captcha_sessions")
        .update({ votos_restantes: session.votos_restantes - 1 })
        .eq("id", payload.captchaId);

      // Insert
      const { data: votoInserido, error: insertError } = await supabase
        .from(TABLE_VOTACAO)
        .insert([{ participante }])
        .select("participante")
        .single();

      if (insertError || !votoInserido) {
        return res.status(500).json({ error: "Falha ao gravar voto no banco." });
      }

      return res.status(200).json({
        success: true,
        participante: votoInserido.participante,
        votosRestantes: session.votos_restantes - 1
      });
    }

    return res.status(400).json({ error: "Ação inválida" });

  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
