const { createClient } = require("@supabase/supabase-js");

const TABLES_PERMITIDAS = ["roça12f10"];

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error("Variáveis de ambiente não definidas");
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { participante, table } = body || {};

    if (!participante || !table) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    if (!TABLES_PERMITIDAS.includes(table)) {
      return res.status(403).json({ error: "Tabela não autorizada" });
    }

    const { error } = await supabase
      .from(table)
      .insert([{ participante }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("🔥 ERRO FATAL:", err);
    return res.status(500).json({
      error: "Erro interno",
      details: err.message
    });
  }
};
