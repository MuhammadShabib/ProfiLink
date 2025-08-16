const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

router.get('/add-project', isAuthenticated, (req, res) => {
  res.render('pages/add-project');
});

router.post('/add-project', isAuthenticated, upload.single('image'), (req, res) => {
  const { title, description, link } = req.body;
  const image = req.file ? req.file.filename : null;
  const userId = req.session.user.id;

  db.query('INSERT INTO projects SET ?', {
    user_id: userId,
    title,
    description,
    link,
    image
  }, (err) => {
    if (err) throw err;
    res.redirect('/my-projects');
  });
});

router.get('/delete-project/:id', isAuthenticated, (req, res) => {
  const projectId = req.params.id;
  const userId = req.session.user.id;

  db.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err) => {
    if (err) throw err;
    res.redirect('/my-projects');
  });
});

router.get('/edit-project/:id', isAuthenticated, (req, res) => {
  const projectId = req.params.id;
  const userId = req.session.user.id;

  db.query('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('پروژه‌ای پیدا نشد.');
    res.render('pages/edit-project', { project: results[0] });
  });
});

router.post('/edit-project/:id', isAuthenticated, upload.single('image'), (req, res) => {
  const { title, description, link } = req.body;
  const projectId = req.params.id;
  const image = req.file ? req.file.filename : null;

  let query = 'UPDATE projects SET title = ?, description = ?, link = ?';
  const params = [title, description, link];

  if (image) {
    query += ', image = ?';
    params.push(image);
  }

  query += ' WHERE id = ?';
  params.push(projectId);

  db.query(query, params, (err) => {
    if (err) throw err;
    res.redirect('/my-projects');
  });
});

router.get('/projects', (req, res) => {
  const userId = req.session.user ? req.session.user.id : null;

  const query = `
    SELECT p.*, u.full_name, u.profession,
      (SELECT COUNT(*) FROM project_likes WHERE project_id = p.id) AS likes,
      (SELECT COUNT(*) FROM project_likes WHERE project_id = p.id AND user_id = ?) AS liked_by_user
    FROM projects p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) throw err;
    res.render('pages/public-projects', { projects: results, userId });
  });
});


router.post('/like/:projectId', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const projectId = req.params.projectId;

  db.query('SELECT * FROM project_likes WHERE project_id = ? AND user_id = ?', [projectId, userId], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      db.query('DELETE FROM project_likes WHERE project_id = ? AND user_id = ?', [projectId, userId], (err2) => {
        if (err2) throw err2;
        res.json({ liked: false });
      });
    } else {
      db.query('INSERT INTO project_likes (project_id, user_id) VALUES (?, ?)', [projectId, userId], (err2) => {
        if (err2) throw err2;
        res.json({ liked: true });
      });
    }
  });
});

router.get('/project/:id', (req, res) => {
  const projectId = req.params.id;
  const userId = req.session.user ? req.session.user.id : null;

  const query = `
    SELECT projects.*, users.full_name, users.profession,
      (SELECT COUNT(*) FROM project_likes WHERE project_id = projects.id) AS likes,
      (SELECT COUNT(*) FROM project_likes WHERE project_id = projects.id AND user_id = ?) AS liked_by_user
    FROM projects
    JOIN users ON projects.user_id = users.id
    WHERE projects.id = ?
  `;

  db.query(query, [userId, projectId], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('پروژه‌ای با این شناسه پیدا نشد.');
    res.render('pages/project-details', { project: results[0], userId });
  });
});

module.exports = router;



