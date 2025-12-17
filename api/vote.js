import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { option, table } = req.body;

  if (!option || !table) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const { error } = await supabase
    .from(table)
    .insert([{ option }]);

  if (error) {
    return res.status(500).json({ error: 'Erro ao salvar voto' });
  }

  return res.json({ success: true });
}

