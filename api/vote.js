import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { option, table, token, captcha } = req.body;

  if (token !== process.env.VOTE_TOKEN) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const { data: status } = await supabase
    .from('controle_votacao')
    .select('aberta')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (!status.aberta) {
    return res.status(403).json({ error: 'Votação encerrada' });
  }

  if (captcha !== 'ok') {
    return res.status(400).json({ error: 'Captcha inválido' });
  }

  const { error } = await supabase
    .from(table)
    .insert([{ option }]);

  if (error) {
    return res.status(500).json({ error: 'Erro ao salvar voto' });
  }

  res.json({ success: true });
}
