import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { table, participante } = req.body;

    // Verifica se os dados foram enviados
    if (!table || !participante) {
      return res.status(400).json({
        error: "Dados incompletos"
      });
    }

    // Insere o voto no Supabase
    const { error } = await supabase
      .from(table)
      .insert([
        {
          participante: participante
        }
      ]);

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
