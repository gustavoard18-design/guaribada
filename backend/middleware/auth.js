const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'guaribada_secret_2024';

exports.authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'Usuário não encontrado' });
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  next();
};

exports.generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
