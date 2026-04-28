/**
 * Script de limpeza — apaga todos os usuários e agendamentos.
 * Serviços são mantidos.
 *
 * Uso:
 *   node scripts/clear-data.js
 *
 * Requer o .env configurado com MONGODB_URI.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guaribada');
  console.log('Conectado ao MongoDB.');

  const usersDeleted    = await mongoose.connection.collection('users').deleteMany({});
  const bookingsDeleted = await mongoose.connection.collection('bookings').deleteMany({});

  console.log(`✅ ${usersDeleted.deletedCount} usuário(s) removido(s).`);
  console.log(`✅ ${bookingsDeleted.deletedCount} agendamento(s) removido(s).`);
  console.log('Serviços mantidos.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
