const { addProject } = require('../controllers/projectController');
router.post('/add-project', upload.single('image'), addProject);
