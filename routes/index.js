const express = require('express');
const router = express.Router();

router.use('/', require('./homeRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/projects', require('./projectRoutes.js'));
router.use('/resume', require('./resumeRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/search', require('./searchRoutes'));
router.use('/static', require('./staticRoutes'));

const searchRoutes = require('./searchRoutes');

router.use('/search', searchRoutes);


module.exports = router;