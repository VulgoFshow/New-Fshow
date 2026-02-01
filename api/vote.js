const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TABLES_PERMITIDAS = ["roça12f10"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { participante, table } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

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
      console.error("Erro Supabase:", error);
      return res.status(500).json({ error: "Erro ao registrar voto" });
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Erro geral:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};
