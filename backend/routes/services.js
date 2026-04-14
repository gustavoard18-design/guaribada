const router = require('express').Router();
const Service = require('../models/Service');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/services  (public)
router.get('/', async (req, res) => {
  const services = await Service.find({ active: true }).sort('price');
  res.json(services);
});

// POST /api/services (admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/services/:id (admin)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
  res.json(service);
});

// DELETE /api/services/:id (admin)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await Service.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ message: 'Serviço desativado' });
});

// Seed initial services
router.post('/seed', authenticate, adminOnly, async (req, res) => {
  const defaults = [
    { name: 'Lavagem Simples',     price: 40,  duration: 30,  icon: '🚿', description: 'Lavagem externa completa' },
    { name: 'Lavagem Completa',    price: 80,  duration: 60,  icon: '✨', description: 'Lavagem interna e externa' },
    { name: 'Higienização Interna',price: 150, duration: 120, icon: '🧹', description: 'Limpeza profunda do interior' },
    { name: 'Polimento',           price: 250, duration: 180, icon: '💎', description: 'Polimento de pintura completo' },
    { name: 'Vitrificação',        price: 500, duration: 240, icon: '🛡️', description: 'Proteção cerâmica de pintura' },
  ];
  await Service.insertMany(defaults);
  res.json({ message: 'Serviços padrão criados!' });
});

module.exports = router;
