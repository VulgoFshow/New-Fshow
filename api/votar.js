import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CAPTCHA_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const TABLE_VOTACAO = "testador";

function decodificarToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    return null;
  }

  const partes = token.split(":");
  if (partes.length !== 2) {
    return null;
  }

  try {
    const iv = Buffer.from(partes[0], "hex");
    const encrypted = Buffer.from(partes[1], "hex");

    if (iv.length !== 16 || encrypted.length === 0) {
      return null;
    }

    const chave = crypto
      .createHash("sha256")
      .update(CAPTCHA_SECRET)
      .digest();

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      chave,
      iv
    );

    let texto = decipher.update(encrypted, undefined, "utf8");
    texto += decipher.final("utf8");

    return JSON.parse(texto);
  } catch (error) {
    console.error("Token CAPTCHA inválido:", error.message);
    return null;
  }
}

function mesmoConjunto(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }

  const esperado = [...a].sort((x, y) => x - y);
  const recebido = [...b].sort((x, y) => x - y);

  return esperado.every((valor, indice) => valor === recebido[indice]);
}

function validarSelecoes(selectedIds) {
  return (
    Array.isArray(selectedIds) &&
    selectedIds.length > 0 &&
    selectedIds.every(id => Number.isInteger(id) && id >= 0) &&
    new Set(selectedIds).size === selectedIds.length
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const body = req.body || {};
    const { action } = body;

    // Esta rota é chamada pelo frontend para validar o CAPTCHA.
    // Ela não envia table nem participante, portanto não pode exigir esses campos aqui.
    if (action === "validar-captcha") {
      const captchaToken = String(body.captchaToken || "").trim();
      const selectedIds = body.selectedIds;

      if (!captchaToken || !validarSelecoes(selectedIds)) {
        return res.status(400).json({
          error: "Dados incompletos"
        });
      }

      const payload = decodificarToken(captchaToken);
      const tokenRecente =
        payload &&
        Number.isFinite(payload.createdAt) &&
        Date.now() - payload.createdAt >= 0 &&
        Date.now() - payload.createdAt <= CAPTCHA_TTL_MS;

      if (!tokenRecente || !validarSelecoes(payload.correctIds)) {
        return res.status(400).json({
          success: false,
          error: "CAPTCHA expirado ou inválido"
        });
      }

      if (!mesmoConjunto(selectedIds, payload.correctIds)) {
        return res.status(400).json({
          success: false,
          error: "CAPTCHA incorreto"
        });
      }

      return res.status(200).json({
        success: true,
        votosLiberados: 1
      });
    }

    // Esta rota é chamada pelo frontend para registrar o voto.
    if (action !== "votar") {
      return res.status(400).json({
        error: "Ação inválida"
      });
    }

    const participante = String(body.participante || "").trim();

    if (!participante) {
      return res.status(400).json({
        error: "Dados incompletos"
      });
    }

    // Não aceite nome de tabela livre vindo do navegador.
    const table = TABLE_VOTACAO;

    const { data: controle, error: controleError } = await supabase
      .from("controle_votacao")
      .select("modo")
      .eq("id", 1)
      .single();

    if (controleError) {
      console.error("Erro ao consultar controle:", controleError);
      return res.status(500).json({
        error: "Não foi possível verificar o status da votação"
      });
    }

    if (controle.modo === "fechada") {
      return res.status(403).json({
        error: "A votação está fechada"
      });
    }

    const { error } = await supabase
      .from(table)
      .insert([{ participante }]);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({
        error: "Erro ao registrar o voto"
      });
    }

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error("Erro no backend:", error);
    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}
