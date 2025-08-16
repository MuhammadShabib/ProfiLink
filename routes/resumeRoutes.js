const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const isAuthenticated = require('../middleware/auth');
const db = require('../db');

// تنظیمات ذخیره فایل رزومه
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/resumes/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 📄 فرم ویرایش رزومه
router.get('/edit-resume', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  db.query('SELECT * FROM resumes WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send('خطا در دریافت اطلاعات رزومه');
    const resume = results.length ? results[0] : null;
    res.render('pages/edit-resume', { resume });
  });
});

router.post('/edit-resume', isAuthenticated, upload.fields([
  { name: 'resume_file', maxCount: 1 },
  { name: 'profile_picture', maxCount: 1 }
]), (req, res) => {
  const {
    summary, age, location, nationality, interests,
    education, experience, skills, languages,
    email, phone
  } = req.body;

  const resume_file = req.files['resume_file'] ? req.files['resume_file'][0].filename : null;
  const profile_picture = req.files['profile_picture'] ? req.files['profile_picture'][0].filename : null;

  const userId = req.session.user.id;

  db.query('SELECT * FROM resumes WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send('خطا در بررسی رزومه');

    if (results.length > 0) {
      // بروزرسانی
      const updateFields = [
        'summary = ?', 'age = ?', 'location = ?', 'nationality = ?',
        'interests = ?', 'education = ?', 'experience = ?',
        'skills = ?', 'languages = ?', 'email = ?', 'phone = ?'
      ];
      const params = [
        summary, age, location, nationality,
        interests, education, experience,
        skills, languages, email, phone
      ];

      if (resume_file) {
        updateFields.push('resume_file = ?');
        params.push(resume_file);
      }
      if (profile_picture) {
        updateFields.push('profile_picture = ?');
        params.push(profile_picture);
      }

      params.push(userId);

      db.query(`UPDATE resumes SET ${updateFields.join(', ')} WHERE user_id = ?`, params, (err2) => {
        if (err2) return res.status(500).send('خطا در بروزرسانی رزومه');
        res.redirect('/resume/profile/' + userId);
      });
    } else {
      // درج جدید
      const resumeData = {
        user_id: userId,
        summary, age, location, nationality,
        interests, education, experience,
        skills, languages, email, phone,
        resume_file, profile_picture
      };

      db.query('INSERT INTO resumes SET ?', resumeData, (err3) => {
        if (err3) return res.status(500).send('خطا در ثبت رزومه');
        res.redirect('/resume/profile/' + userId);
      });
    }
  });
});

router.get('/profile/:id', (req, res) => {
  const userId = req.params.id;

  db.query(`
    SELECT users.*, 
           resumes.profile_picture,
           resumes.summary,
           resumes.education,
           resumes.experience,
           resumes.skills,
           resumes.languages,
           resumes.resume_file,
           resumes.email AS resume_email,
           resumes.phone AS resume_phone
    FROM users
    LEFT JOIN resumes ON users.id = resumes.user_id
    WHERE users.id = ?
  `, [userId], (err, results) => {
    if (err) return res.status(500).send('خطا در دریافت اطلاعات کاربر');
    if (!results.length) return res.status(404).send('کاربر یافت نشد');

    const user = results[0];
    // ایمیل و شماره تلفن را از رزومه جایگزین کن اگر مقدار داشت
    user.email = user.resume_email || user.email;
    user.phone = user.resume_phone || user.phone;

    res.render('pages/public-profile', { user });
  });
});


module.exports = router;
