const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const mysql = require('mysql2');

const db = require('../db');


router.get('/dashboard', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.query(`
    SELECT users.*, resumes.profile_picture 
    FROM users
    LEFT JOIN resumes ON users.id = resumes.user_id
    WHERE users.id = ?
  `, [userId], (err, results) => {
    if (err) throw err;
    const user = results[0];
    res.render('pages/dashboard', { user });
  });
});

router.get('/my-projects', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  db.query('SELECT * FROM projects WHERE user_id = ?', [userId], (err, results) => {
    if (err) throw err;
    res.render('pages/my-projects', { projects: results });
  });
});

module.exports = router;
