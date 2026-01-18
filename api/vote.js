import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES_PERMITIDAS = [
  "paiolf10",
  "roça1f10",
  "roça2f10",
  "roça3f10",
  "roça4f10",
  "roça5f10",
  "roça6f10",
  "roça7f10",
  "roça8f10",
  "roça9f10",
  "finalf10"
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
      .insert({ participante });

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
