import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES_PERMITIDAS = [
  "f3roça9",
  "f3roça10",
  "f3roça11",
  "f3roça12",
  "f3roça13",
  "f3roça14",
  "f3roça15",
  "f3roça16",
  "f3final"
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { participante, table } = body || {};

    if (!participante || !table) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    if (!TABLES_PERMITIDAS.includes(table)) {
      return res.status(403).json({ error: "Table não autorizada" });
    }

    const { error } = await supabase
      .from(table)
      .insert([{ participante }]);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({ error: "Erro ao salvar voto" });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Erro geral:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
