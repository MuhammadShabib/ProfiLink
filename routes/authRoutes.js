const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db');

router.get('/register', (req, res) => {


  res.render('pages/register', { specialties: results });
});

router.post('/register', async (req, res) => {
  const { full_name, email, password, profession } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      return res.send('این ایمیل قبلاً استفاده شده است.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users SET ?', {
      full_name,
      email,
      password: hashedPassword,
      profession
    }, (err, result) => {
      if (err) throw err;
      res.redirect('/login');
    });
  });
});

router.get('/login', (req, res) => {
  res.render('pages/login');
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('ایمیل یا رمز اشتباه است.');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('ایمیل یا رمز اشتباه است.');

    req.session.user = {
      id: user.id,
      name: user.full_name,
      profession: user.profession,
      email: user.email
    };

    res.redirect('/dashboard');
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
