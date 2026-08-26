import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {

    const { table, participante } = req.body || {};

    // ==============================
    // VALIDAR DADOS
    // ==============================

    if (!table || !participante) {
      return res.status(400).json({
        error: "Dados incompletos"
      });
    }

    // ==============================
    // CONSULTAR CONTROLE
    // ==============================

    const { data: controle, error: controleError } =
      await supabase
        .from("controle_votacao")
        .select("modo")
        .eq("id", 1)
        .single();

    if (controleError) {

      console.error(
        "Erro ao consultar controle:",
        controleError
      );

      return res.status(500).json({
        error: "Não foi possível verificar o status da votação"
      });
    }

    // ==============================
    // VOTAÇÃO FECHADA
    // ==============================

    if (controle.modo === "fechada") {

      return res.status(403).json({
        error: "A votação está fechada"
      });

    }

    // ==============================
    // REGISTRAR VOTO
    // ==============================

    const { error } = await supabase
      .from(table)
      .insert([
        {
          participante: participante
        }
      ]);

    if (error) {

      console.error(
        "Erro Supabase:",
        error
      );

      return res.status(500).json({
        error: "Erro ao registrar o voto"
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {

    console.error(
      "Erro no backend:",
      error
    );

    return res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}
