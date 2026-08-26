import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PAINEL_SENHA = process.env.PAINEL_SENHA;

export default async function handler(req, res) {

  // ==============================
  // GET — CONSULTAR STATUS
  // ==============================

  if (req.method === "GET") {

    try {

      const { data, error } = await supabase
        .from("controle_votacao")
        .select("modo, atualizado_em")
        .eq("id", 1)
        .single();

      if (error) {

        console.error("Erro ao consultar controle:", error);

        return res.status(500).json({
          success: false,
          error: "Erro ao consultar status da votação."
        });
      }

      return res.status(200).json({
        success: true,
        modo: data.modo,
        atualizadoEm: data.atualizado_em
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor."
      });
    }
  }


  // ==============================
  // POST — ALTERAR STATUS
  // ==============================

  if (req.method === "POST") {

    try {

      const { modo, senha } = req.body || {};

      // Verifica senha
      if (!PAINEL_SENHA || senha !== PAINEL_SENHA) {

        return res.status(401).json({
          success: false,
          error: "Não autorizado."
        });
      }

      // Verifica modo
      if (!["automatico", "aberta", "fechada"].includes(modo)) {

        return res.status(400).json({
          success: false,
          error: "Modo inválido."
        });
      }

      const { data, error } = await supabase
        .from("controle_votacao")
        .update({
          modo: modo,
          atualizado_em: new Date().toISOString()
        })
        .eq("id", 1)
        .select("modo, atualizado_em")
        .single();

      if (error) {

        console.error("Erro ao alterar controle:", error);

        return res.status(500).json({
          success: false,
          error: "Erro ao alterar status da votação."
        });
      }

      return res.status(200).json({
        success: true,
        modo: data.modo,
        atualizadoEm: data.atualizado_em
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        error: "Erro interno do servidor."
      });
    }
  }


  return res.status(405).json({
    success: false,
    error: "Método não permitido."
  });
}
