const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Guaribada' }));

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guaribada')
  .then(() => {
    console.log('✅ MongoDB conectado');
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`🚗 Guaribada API rodando na porta ${PORT}`));
  })
  .catch(err => { console.error('❌ Erro MongoDB:', err); process.exit(1); });
