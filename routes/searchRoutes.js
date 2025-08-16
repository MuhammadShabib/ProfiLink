const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/projects', (req, res) => {
  res.render('pages/search');
});

router.post('/results', (req, res) => {
  const { keyword } = req.body;

  const query = `
    SELECT projects.*, users.full_name 
    FROM projects 
    JOIN users ON projects.user_id = users.id
    WHERE projects.title LIKE ? 
       OR projects.description LIKE ? 
       OR projects.technologies LIKE ?
  `;

  const likeKeyword = `%${keyword}%`;

  db.query(query, [likeKeyword, likeKeyword, likeKeyword], (err, results) => {
    if (err) {
      console.error('خطا در جستجو:', err);
      return res.status(500).send('مشکلی در سرور رخ داد.');
    }

    res.render('pages/searchResults', {
      keyword,
      results
    });
  });
});

module.exports = router;
