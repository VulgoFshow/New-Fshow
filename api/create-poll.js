import { createClient } from "@supabase/supabase-js";
import slugify from "slugify";

// Configuração do Supabase (usando variáveis de ambiente como no código original)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função auxiliar para gerar um slug único
async function generateUniqueSlug(title) {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("votacoes")
      .select("slug")
      .eq("slug", slug)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 means "no rows found"
        throw error;
    }

    if (!data) {
      return slug; // Slug is unique
    }

    // Slug is not unique, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { titulo, opcoes, senha_admin } = body || {};

    // 1. Validação de entrada
    if (!titulo || !senha_admin || !opcoes || !Array.isArray(opcoes) || opcoes.length < 2) {
      return res.status(400).json({ error: "Dados inválidos. Título, senha e pelo menos duas opções são obrigatórios." });
    }

    // 2. Geração de slug único
    const slug = await generateUniqueSlug(titulo);

    // 3. Inserir a nova votação
    const { data: votacaoData, error: votacaoError } = await supabase
      .from("votacoes")
      .insert([{ titulo, slug, senha_admin }])
      .select("id")
      .single();

    if (votacaoError) {
      console.error("Erro Supabase ao criar votação:", votacaoError);
      return res.status(500).json({ error: "Erro ao salvar a votação principal." });
    }

    const votacao_id = votacaoData.id;

    // 4. Preparar e inserir as opções
    const opcoesParaInserir = opcoes.map((texto, index) => ({
      votacao_id,
      texto,
      ordem: index + 1,
    }));

    const { error: opcoesError } = await supabase
      .from("opcoes")
      .insert(opcoesParaInserir);

    if (opcoesError) {
      // Em um ambiente de produção, você deve considerar reverter a inserção da votação (transação)
      console.error("Erro Supabase ao inserir opções:", opcoesError);
      return res.status(500).json({ error: "Erro ao salvar as opções da votação." });
    }

    // 5. Retornar o link único
    return res.status(201).json({
      success: true,
      message: "Votação criada com sucesso!",
      slug: slug,
      link_votacao: `/votacao/${slug}`, // URL que o frontend usará
      link_admin: `/admin/${slug}?senha=${senha_admin}` // Link para o criador
    });

  } catch (err) {
    console.error("Erro geral na criação da votação:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
