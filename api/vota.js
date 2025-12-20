import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função para obter o IP do cliente (depende do ambiente de hospedagem, ex: Vercel)
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { slug, opcao_id } = body || {};

    if (!slug || !opcao_id) {
      return res.status(400).json({ error: "Dados inválidos. Slug da votação e ID da opção são obrigatórios." });
    }

    // 1. Obter a votação pelo slug
    const { data: votacao, error: votacaoError } = await supabase
      .from("votacoes")
      .select("id")
      .eq("slug", slug)
      .single();

    if (votacaoError || !votacao) {
      return res.status(404).json({ error: "Votação não encontrada." });
    }

    const votacao_id = votacao.id;

    // 2. Validar se a opção pertence à votação
    const { data: opcao, error: opcaoError } = await supabase
      .from("opcoes")
      .select("id")
      .eq("id", opcao_id)
      .eq("votacao_id", votacao_id)
      .single();

    if (opcaoError || !opcao) {
      return res.status(400).json({ error: "Opção inválida para esta votação." });
    }

    // 3. Prevenção básica de votos duplicados (por IP)
    const clientIp = getClientIp(req);
    const ipHash = clientIp ? crypto.createHash('sha256').update(clientIp).digest('hex') : null;

    if (ipHash) {
        const { data: votoExistente, error: checkError } = await supabase
            .from("votos")
            .select("id")
            .eq("votacao_id", votacao_id)
            .eq("ip_hash", ipHash)
            .limit(1);

        if (checkError) {
            console.error("Erro ao verificar voto existente:", checkError);
            // Continua, mas loga o erro
        } else if (votoExistente && votoExistente.length > 0) {
            return res.status(403).json({ error: "Você já votou nesta enquete." });
        }
    }

    // 4. Inserir o voto
    const { error: insertError } = await supabase
      .from("votos")
      .insert([{ votacao_id, opcao_id, ip_hash: ipHash }]);

    if (insertError) {
      console.error("Erro Supabase ao salvar voto:", insertError);
      return res.status(500).json({ error: "Erro ao salvar voto." });
    }

    // 5. Retornar sucesso
    return res.status(200).json({ success: true, message: "Voto registrado com sucesso!" });

  } catch (err) {
    console.error("Erro geral no registro de voto:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
