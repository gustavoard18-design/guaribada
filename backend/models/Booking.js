const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guest:   { name: String, phone: String, email: String },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date:    { type: Date, required: true },
  status:  {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  vehicle: {
    plate: String,
    model: String,
    color: String,
  },
  notes:      { type: String },
  totalPrice: { type: Number },
}, { timestamps: true });

// Prevent double-booking same slot
BookingSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
