import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: "Slug da votação é obrigatório." });
  }

  try {
    // 1. Obter a votação e suas opções
    const { data: votacaoData, error: votacaoError } = await supabase
      .from("votacoes")
      .select(`
        id,
        titulo,
        opcoes (
          id,
          texto
        )
      `)
      .eq("slug", slug)
      .single();

    if (votacaoError || !votacaoData) {
      return res.status(404).json({ error: "Votação não encontrada." });
    }

    const votacao_id = votacaoData.id;
    const opcoes = votacaoData.opcoes;

    // 2. Contar os votos por opção
    const { data: votosData, error: votosError } = await supabase
      .from("votos")
      .select("opcao_id, count")
      .eq("votacao_id", votacao_id)
      .order("count", { ascending: false })
      .limit(100); // Limite para evitar sobrecarga, ajuste conforme necessário

    if (votosError) {
      console.error("Erro Supabase ao contar votos:", votosError);
      return res.status(500).json({ error: "Erro ao buscar resultados." });
    }

    // 3. Combinar opções e contagem de votos
    const resultados = opcoes.map(opcao => {
      const voto = votosData.find(v => v.opcao_id === opcao.id);
      return {
        id: opcao.id,
        texto: opcao.texto,
        votos: voto ? voto.count : 0,
      };
    });

    // 4. Calcular o total de votos
    const totalVotos = resultados.reduce((acc, curr) => acc + curr.votos, 0);

    // 5. Retornar os resultados
    return res.status(200).json({
      success: true,
      titulo: votacaoData.titulo,
      totalVotos,
      resultados,
    });

  } catch (err) {
    console.error("Erro geral na consulta de resultados:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
