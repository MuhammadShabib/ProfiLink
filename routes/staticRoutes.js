const express = require('express');
const router = express.Router();

router.get('/about', (req, res) => {
  res.render('pages/about');
});

router.get('/contact', (req, res) => {
  res.render('pages/contact');
});

router.get('/', (req, res) => {
  res.render('pages/home');
});

module.exports = router;
