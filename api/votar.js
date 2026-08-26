import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Aceita apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      erro: "Método não permitido"
    });
  }

  try {
    const { participante } = req.body;

    // Apenas pega o participante enviado pelo frontend
    if (!participante) {
      return res.status(400).json({
        sucesso: false,
        erro: "Participante não informado"
      });
    }

    // Informações do Supabase ficam somente no servidor
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("cdbnc")
      .insert([
        {
          participante: participante
        }
      ]);

    if (error) {
      console.error("Erro Supabase:", error);

      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao registrar voto"
      });
    }

    return res.status(200).json({
      sucesso: true
    });

  } catch (error) {
    console.error("Erro interno:", error);

    return res.status(500).json({
      sucesso: false,
      erro: "Erro interno do servidor"
    });
  }
}
