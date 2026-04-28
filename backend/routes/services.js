const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, adminOnly } = require('../middleware/auth');

const fmt = s => s ? { ...s, _id: s.id } : null;

// GET /api/services (público)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('services').select('*').eq('active', true).order('price');
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(fmt));
});

// POST /api/services (admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  const { name, price, duration } = req.body;
  if (!name?.trim())           return res.status(400).json({ error: 'Nome é obrigatório' });
  if (!price || price <= 0)    return res.status(400).json({ error: 'Preço deve ser maior que zero' });
  if (!duration || duration <= 0) return res.status(400).json({ error: 'Duração deve ser maior que zero' });

  const { data, error } = await supabase.from('services').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(fmt(data));
});

// PUT /api/services/:id (admin)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { name, price, duration } = req.body;
  if (name !== undefined && !name?.trim())       return res.status(400).json({ error: 'Nome não pode ser vazio' });
  if (price !== undefined && price <= 0)         return res.status(400).json({ error: 'Preço deve ser maior que zero' });
  if (duration !== undefined && duration <= 0)   return res.status(400).json({ error: 'Duração deve ser maior que zero' });

  const { data, error } = await supabase
    .from('services').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Serviço não encontrado' });
  res.json(fmt(data));
});

// DELETE /api/services/:id (admin — soft delete)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { error } = await supabase
    .from('services').update({ active: false }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Serviço desativado' });
});

// POST /api/services/seed (admin — idempotente)
router.post('/seed', authenticate, adminOnly, async (req, res) => {
  const defaults = [
    { name: 'Lavagem Simples',      price: 40,  duration: 30,  icon: '🚿', description: 'Lavagem externa completa' },
    { name: 'Lavagem Completa',     price: 80,  duration: 60,  icon: '✨', description: 'Lavagem interna e externa' },
    { name: 'Higienização Interna', price: 150, duration: 120, icon: '🧹', description: 'Limpeza profunda do interior' },
    { name: 'Polimento',            price: 250, duration: 180, icon: '💎', description: 'Polimento de pintura completo' },
    { name: 'Vitrificação',         price: 500, duration: 240, icon: '🛡️', description: 'Proteção cerâmica de pintura' },
  ];

  let created = 0;
  for (const svc of defaults) {
    const { data: existing } = await supabase.from('services').select('id').eq('name', svc.name).maybeSingle();
    if (!existing) { await supabase.from('services').insert(svc); created++; }
  }
  res.json({ message: `${created} serviço(s) padrão criado(s).` });
});

module.exports = router;
