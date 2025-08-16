const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

const routes = require('./routes/index');
app.use('/', routes);

const homeRoutes = require('./routes/homeRoutes');
app.use('/', homeRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use(dashboardRoutes);

const projectRoutes = require('./routes/projectRoutes');
app.use(projectRoutes);

const resumeRoutes = require('./routes/resumeRoutes');
app.use(resumeRoutes);

app.use('/uploads', express.static('uploads'));
app.use('/resume', require('./routes/resumeRoutes'));
app.use('/uploads/resumes', express.static('uploads/resumes'));


const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const staticRoutes = require('./routes/staticRoutes');
app.use('/', staticRoutes);


app.use((req, res) => {
    res.status(404).render('pages/404');
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
