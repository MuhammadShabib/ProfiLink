exports.addProject = (req, res) => {
  const { title, description, link } = req.body;
  const image = req.file ? req.file.filename : null;
  const userId = req.session.user.id;

  db.query('INSERT INTO projects SET ?', {
      user_id: userId,
      title,
      description,
      image,
      link
  }, (err) => {
      if (err) throw err;
      res.redirect('/my-projects');
  });
};