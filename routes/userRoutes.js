const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const isAuthenticated = require('../middleware/auth');
require('dotenv').config();
const db = require('../db');
function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'کد تأیید ثبت‌نام',
    text: `کد تأیید شما: ${code}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('خطا در ارسال ایمیل:', err);
    } else {
      console.log('ایمیل ارسال شد:', info.response);
    }
  });
}


router.get('/register', (req, res) => {
  res.render('pages/register');
});

router.post('/register', async (req, res) => {
  const { full_name, email, password, profession } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length > 0) {
      return res.redirect('/login');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = crypto.randomInt(100000, 999999).toString();

    db.query('DELETE FROM pending_users WHERE email = ?', [email], () => {
      db.query('INSERT INTO pending_users SET ?', {
        full_name,
        email,
        password: hashedPassword,
        profession,
        code
      }, async (err2) => {
        if (err2) throw err2;

        await sendVerificationEmail(email, code);
        req.session.pendingEmail = email;
        res.redirect('/verify');
      });
    });
  });
});

router.get('/verify', (req, res) => {
  if (!req.session.pendingEmail) return res.redirect('/register');
  res.render('pages/verify');
});

router.post('/verify', (req, res) => {
  const { code } = req.body;
  const email = req.session.pendingEmail;

  if (!email) return res.redirect('/register');

  db.query('SELECT * FROM pending_users WHERE email = ?', [email], (err, results) => {
    if (err) throw err;
    if (results.length === 0 || results[0].code !== code) {
      return res.send('کد تأیید نادرست است.');
    }

    const user = results[0];
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 10) {
      return res.send('کد منقضی شده است.');
    }

    db.query('INSERT INTO users SET ?', {
      full_name: user.full_name,
      email: user.email,
      password: user.password,
      profession: user.profession
    }, (err2, insertResult) => {
      if (err2) throw err2;

      const newUserId = insertResult.insertId;

      db.query('DELETE FROM pending_users WHERE email = ?', [email]);

      req.session.user = {
        id: newUserId,
        name: user.full_name,
        profession: user.profession
      };

      res.redirect('/resume/edit-resume');
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
    if (results.length === 0) return res.send('ایمیل یا رمز عبور اشتباه است.');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('ایمیل یا رمز عبور اشتباه است.');

    req.session.user = {
      id: user.id,
      name: user.full_name,
      profession: user.profession
    };
    res.redirect('/dashboard');
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('pages/dashboard', { user: req.session.user });
});

router.get('/users', (req, res) => {
  db.query('SELECT id, full_name, profession FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) throw err;
    res.render('pages/users', { users: results });
  });
});

module.exports = router;
