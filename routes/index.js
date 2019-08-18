const router = require('express').Router();
const apiRoutes = require('./libraryRoutes');
const authRoutes = require('./authRoutes');
const calendarRoutes = require('./calendarRoutes');
const { requiresLogin } = require('./middleware/authMiddleware');

router.use('/auth', authRoutes);
router.use('/library', requiresLogin, apiRoutes);
router.use('/calendar', requiresLogin, calendarRoutes);

module.exports = router;
