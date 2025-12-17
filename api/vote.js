import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Aceita apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { option, table, captcha } = req.body;

  // Validação básica
  if (!option || !table) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  /* =============================
   ENCERRAMENTO
============================= */
const ENCERRA_EM = new Date("2025-12-17T23:30:00-03:00");

if (new Date() >= ENCERRA_EM) {
  return res.status(403).json({ error: "Votação encerrada" });
}
const DATA_ENCERRAMENTO = "2025-12-17T18:00:00-03:00";

  // Verifica se a votação está aberta
  const { data: status, error: statusError } = await supabase
    .from('controle_votacao')
    .select('aberta')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (statusError || !status?.aberta) {
    return res.status(403).json({ error: 'Votação encerrada' });
  }

  // Validação simples do captcha
  if (captcha !== 'ok') {
    return res.status(400).json({ error: 'Captcha inválido' });
  }

  // Salva o voto
  const { error } = await supabase
    .from(table)
    .insert([{ option }]);

  if (error) {
    return res.status(500).json({ error: 'Erro ao salvar voto' });
  }

  // Sucesso
  return res.json({ success: true });
}
