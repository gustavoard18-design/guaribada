const router = require('express').Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/bookings/available-slots?date=YYYY-MM-DD&serviceId=xxx
router.get('/available-slots', authenticate, async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) return res.status(400).json({ error: 'Parâmetros ausentes' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  const start = new Date(date); start.setHours(8, 0, 0, 0);
  const end   = new Date(date); end.setHours(18, 0, 0, 0);

  const booked = await Booking.find({
    date: { $gte: start, $lt: end },
    status: { $nin: ['cancelled'] },
  }).populate('service');

 // Build occupied minutes (count per interval)
  const occupied = {};
  booked.forEach(b => {
    const slotStart = b.date.getHours() * 60 + b.date.getMinutes();
    for (let m = slotStart; m < slotStart + b.service.duration; m += 30) {
      occupied[m] = (occupied[m] || 0) + 1;
    }
  });

  // Generate 30-min slots from 08:00 to 17:30 (max 2 per slot)
  const slots = [];
  for (let m = 8 * 60; m <= 17 * 60 + 30; m += 30) {
    const slotEnd = m + service.duration;
    const available = ![...Array(Math.ceil(service.duration / 30))].some((_, i) => (occupied[m + i * 30] || 0) >= 2)
                   && slotEnd <= 18 * 60;
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push({ time: `${hh}:${mm}`, available });
  }
  res.json(slots);
});

// POST /api/bookings
router.post('/', authenticate, async (req, res) => {
  try {
    const { serviceId, date, vehicle, notes } = req.body;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const booking = await Booking.create({
      client: req.user._id,
      service: serviceId,
      date: new Date(date),
      vehicle,
      notes,
      totalPrice: service.price,
    });
    await booking.populate(['client', 'service']);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookings/my — client's own bookings
router.get('/my', authenticate, async (req, res) => {
  const bookings = await Booking.find({ client: req.user._id })
    .populate('service').sort({ date: -1 });
  res.json(bookings);
});

// GET /api/bookings — admin: all bookings
router.get('/', authenticate, adminOnly, async (req, res) => {
  const { date, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (date) {
    const d = new Date(date);
    filter.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
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

// PATCH /api/bookings/:id/status — admin
router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate(['client', 'service']);
  if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });
  res.json(booking);
});

// DELETE /api/bookings/:id — cancel
router.delete('/:id', authenticate, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });
  const isOwner = booking.client.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
  await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  res.json({ message: 'Agendamento cancelado' });
});

module.exports = router;
