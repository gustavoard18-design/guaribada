const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  price:       { type: Number, required: true },
  duration:    { type: Number, required: true }, // minutes
  icon:        { type: String, default: '🚗' },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
