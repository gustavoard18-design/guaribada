const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
