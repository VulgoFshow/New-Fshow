import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('controle_votacao')
    .select('aberta')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar status' });
  }

  res.json({ aberta: data.aberta });
}
