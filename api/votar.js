import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ===============================
// CONFIGURAÇÕES ESCONDIDAS
// ===============================

const pesoVoto = 1;
const VOTOS_POR_CAPTCHA = 10;

const CAPTCHA_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;


// ===============================
// LER TOKEN DO CAPTCHA
// ===============================

function lerToken(token) {

  try {

    if (!token || typeof token !== "string") {
      return null;
    }

    const partes = token.split(":");

    if (partes.length !== 2) {
      return null;
    }

    const iv = Buffer.from(partes[0], "hex");
    const encrypted = partes[1];

    const chave = crypto
      .createHash("sha256")
      .update(CAPTCHA_SECRET)
      .digest();

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      chave,
      iv
    );

    let decrypted = decipher.update(
      encrypted,
      "hex",
      "utf8"
    );

    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);

  } catch (error) {

    console.error("Token CAPTCHA inválido:", error);

    return null;
  }
}


// ===============================
// HANDLER
// ===============================

export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Método não permitido"
    });

  }

  try {

    const {
      action,
      table,
      participante,
      captchaToken,
      selectedIds
    } = req.body || {};


    // ==================================================
    // VALIDAR CAPTCHA
    // ==================================================

    if (action === "validar-captcha") {

      const captcha = lerToken(captchaToken);

      if (!captcha) {

        return res.status(400).json({
          success: false,
          error: "CAPTCHA inválido."
        });

      }

      // CAPTCHA expira em 5 minutos
      const expiracao = 5 * 60 * 1000;

      if (
        !captcha.createdAt ||
        Date.now() - captcha.createdAt > expiracao
      ) {

        return res.status(400).json({
          success: false,
          error: "CAPTCHA expirado. Gere um novo CAPTCHA."
        });

      }

      if (!Array.isArray(selectedIds)) {

        return res.status(400).json({
          success: false,
          error: "Seleção do CAPTCHA inválida."
        });

      }

      const corretos = captcha.correctIds
        .map(Number)
        .sort((a, b) => a - b);

      const selecionados = selectedIds
        .map(Number)
        .sort((a, b) => a - b);

      const correto =
        corretos.length === selecionados.length &&
        corretos.every(
          (id, index) => id === selecionados[index]
        );

      if (!correto) {

        return res.status(400).json({
          success: false,
          error: "CAPTCHA incorreto. Tente novamente."
        });

      }

      return res.status(200).json({
        success: true,
        votosLiberados: VOTOS_POR_CAPTCHA
      });
    }


    // ==================================================
    // REGISTRAR VOTO
    // ==================================================

    if (action === "votar") {

      if (!table || !participante) {

        return res.status(400).json({
          success: false,
          error: "Dados incompletos."
        });

      }

      const votos = [];

      for (let i = 0; i < pesoVoto; i++) {

        votos.push({
          participante: participante
        });

      }

      const { error } = await supabase
        .from(table)
        .insert(votos);

      if (error) {

        console.error("Erro Supabase:", error);

        return res.status(500).json({
          success: false,
          error: error.message
        });

      }

      return res.status(200).json({
        success: true
      });
    }


    // ==================================================
    // AÇÃO INVÁLIDA
    // ==================================================

    return res.status(400).json({
      success: false,
      error: "Ação inválida."
    });

  } catch (error) {

    console.error("Erro no backend:", error);

    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor."
    });

  }
}
