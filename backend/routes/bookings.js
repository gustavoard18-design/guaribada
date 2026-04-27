const router = require('express').Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { authenticate, adminOnly, optionalAuthenticate } = require('../middleware/auth');

// Helper: build occupied minutes set for a given day
async function getOccupiedMinutes(dayStart, dayEnd, excludeId = null) {
  const query = {
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $nin: ['cancelled'] },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const booked = await Booking.find(query).populate('service');
  const occupied = new Set();
  booked.forEach(b => {
    const slotStart = b.date.getHours() * 60 + b.date.getMinutes();
    for (let m = slotStart; m < slotStart + b.service.duration; m += 30) occupied.add(m);
  });
  return occupied;
}

// Helper: check if a given date/duration has a conflict
function hasTimeConflict(occupied, bookingDate, duration) {
  const requestedMinute = bookingDate.getHours() * 60 + bookingDate.getMinutes();
  const slotsNeeded = Math.ceil(duration / 30);
  return Array.from({ length: slotsNeeded }, (_, i) => requestedMinute + i * 30)
              .some(m => occupied.has(m));
}

// GET /api/bookings/available-slots?date=YYYY-MM-DD&serviceId=xxx  (public)
router.get('/available-slots', async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) return res.status(400).json({ error: 'Parâmetros ausentes' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  const start = new Date(date); start.setHours(8, 0, 0, 0);
  const end   = new Date(date); end.setHours(18, 0, 0, 0);

  const occupied = await getOccupiedMinutes(start, end);

  // Generate 30-min slots from 08:00 to 17:30
  const slots = [];
  for (let m = 8 * 60; m <= 17 * 60 + 30; m += 30) {
    const slotEnd = m + service.duration;
    const available = ![...Array(Math.ceil(service.duration / 30))].some((_, i) => occupied.has(m + i * 30))
                   && slotEnd <= 18 * 60;
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push({ time: `${hh}:${mm}`, available });
  }
  res.json(slots);
});

// POST /api/bookings  (autenticado ou convidado)
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { serviceId, date, vehicle, notes, guest } = req.body;

    if (!serviceId || !date) return res.status(400).json({ error: 'Serviço e data são obrigatórios' });

    // Precisa de usuário logado OU dados do convidado
    if (!req.user && !guest?.name?.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório para agendamento sem cadastro' });
    }
    if (!req.user && !guest?.phone?.trim()) {
      return res.status(400).json({ error: 'Telefone é obrigatório para agendamento sem cadastro' });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) return res.status(400).json({ error: 'Data inválida' });

    const dayStart = new Date(bookingDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    const occupied = await getOccupiedMinutes(dayStart, dayEnd);
    if (hasTimeConflict(occupied, bookingDate, service.duration)) {
      return res.status(409).json({ error: 'Horário não disponível. Escolha outro horário.' });
    }

    const bookingData = {
      service: serviceId,
      date: bookingDate,
      vehicle,
      notes,
      totalPrice: service.price,
    };
    if (req.user) bookingData.client = req.user._id;
    if (guest?.name) bookingData.guest = guest;

    const booking = await Booking.create(bookingData);
    await booking.populate(['client', 'service']);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookings/my — agendamentos do cliente logado
router.get('/my', authenticate, async (req, res) => {
  const bookings = await Booking.find({ client: req.user._id })
    .populate('service').sort({ date: -1 });
  res.json(bookings);
});

// GET /api/bookings — admin: todos os agendamentos
router.get('/', authenticate, adminOnly, async (req, res) => {
  const { date, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (date) {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    filter.date = { $gte: dayStart, $lt: dayEnd };
  }
  const bookings = await Booking.find(filter)
    .populate('client', 'name email phone')
    .populate('service')
    .sort({ date: 1 });
  res.json(bookings);
});

// GET /api/bookings/dashboard — admin stats
router.get('/dashboard', authenticate, adminOnly, async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

  const [total, todayCount, pending, completed, revenue] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ date: { $gte: today, $lte: todayEnd } }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'completed' }),
    Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
  ]);

  res.json({ total, todayCount, pending, completed, revenue: revenue[0]?.total || 0 });
});

// PATCH /api/bookings/:id/reschedule — remarcar agendamento
router.patch('/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Nova data é obrigatória' });

    const booking = await Booking.findById(req.params.id).populate('service');
    if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const isOwner = booking.client?.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissão' });

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Este agendamento não pode ser remarcado' });
    }

    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) return res.status(400).json({ error: 'Data inválida' });

    const dayStart = new Date(newDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(newDate); dayEnd.setHours(23, 59, 59, 999);

    const occupied = await getOccupiedMinutes(dayStart, dayEnd, req.params.id);
    if (hasTimeConflict(occupied, newDate, booking.service.duration)) {
      return res.status(409).json({ error: 'Horário não disponível. Escolha outro horário.' });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { date: newDate, status: 'pending' },
      { new: true }
    ).populate(['client', 'service']);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status — admin
router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate(['client', 'service']);
  if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });
  res.json(booking);
});

// DELETE /api/bookings/:id — cancelar
router.delete('/:id', authenticate, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });
  const isOwner = booking.client?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
  await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  res.json({ message: 'Agendamento cancelado' });
});

module.exports = router;
