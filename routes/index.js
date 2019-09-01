const router = require('express').Router();
const apiRoutes = require('./libraryRoutes');
const authRoutes = require('./authRoutes');
const eventsRoutes = require('./eventRoutes');
const { requiresLogin } = require('./middleware/authMiddleware');

router.use('/auth', authRoutes);
router.use('/library', apiRoutes);
router.use('/events', requiresLogin, eventsRoutes);

module.exports = router;
