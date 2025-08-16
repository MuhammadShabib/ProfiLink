const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const sampleQuery = `
    SELECT projects.*, users.full_name, users.profession
    FROM projects
    JOIN users ON projects.user_id = users.id
    ORDER BY projects.id DESC
    LIMIT 3
  `;

  db.query(sampleQuery, (err, results) => {
    if (err) {
      console.error('خطا در دریافت پروژه‌های نمونه:', err);
      return res.render('pages/home', {
        projects: [],
        keyword: undefined,
        results: undefined
      });
    }

    res.render('pages/home', {
      projects: results,
      keyword: undefined,
      results: undefined
    });
  });
});

router.post('/projects', (req, res) => {
  const { keyword } = req.body;
  const likeKeyword = `%${keyword}%`;

  const query = `
    SELECT projects.*, users.full_name 
    FROM projects 
    JOIN users ON projects.user_id = users.id
    WHERE projects.title LIKE ? 
       OR projects.description LIKE ?
  `;

  db.query(query, [likeKeyword, likeKeyword], (err, results) => {
    if (err) {
      console.error('خطا در جستجو:', err);
      return res.status(500).send('مشکلی در سرور رخ داد.');
    }

    res.render('pages/projects', {
      projects: [], 
      keyword,
      results
    });
  });
});

module.exports = router;
