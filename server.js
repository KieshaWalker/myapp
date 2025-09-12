// server.js — main application entry point
// This file bootstraps the Express app: loads environment variables, connects to MongoDB,
// sets up middleware (body parsing, sessions, logging, method override), and mounts routers.
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
const passUser = require('./middleware/passUser');
const isSignedIn = require('./middleware/isSignedin.js');

// Routers — each file handles a feature area
const nutritionRouter = require('./routes/nutrition');
const habitRouter = require('./routes/habitRoutes');
const logRouter = require('./routes/logRoutes');
const userRouter = require('./routes/userRoutes');
// Connect to MongoDB — URI is read from .env (MONGODB_URI)
mongoose.connect(process.env.MONGODB_URI);
const port = process.env.PORT ? process.env.PORT : '3000';

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// Global middleware setup
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // parse form submissions
app.use(methodOverride('_method')); // allows HTML forms to emulate PUT/DELETE via ?_method=PUT
app.use(morgan('dev')); // request logging in development-friendly format
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static(path.join(__dirname, 'public'))); // serve files in /public at /


// passUser makes the current user available as res.locals.user to all EJS views
app.use(passUser);

// Root route — simple homepage
app.get('/', async (req, res) => {
  res.render('index.ejs');
});
// API testing UI (Nutrition Macros tester) — protected, requires login
app.get('/api-test', isSignedIn, (req, res) => {
  res.render('api-test.ejs');
});


// Convenience redirects so /register and /login work without /users prefix
app.get('/register', (req, res) => res.redirect('/users/register'));
app.get('/login', (req, res) => res.redirect('/users/login'));
app.get('/logins', (req, res) => res.redirect('/users/login'));

// app.use(isSignedIn); // Use route-level protection instead


// Mount routers under their base paths
app.use('/nutrition', nutritionRouter);
app.use('/habits', habitRouter);
app.use('/logs', logRouter);
app.use('/users', userRouter);
// app.use(isSignedIn); // Use route-level protection instead

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

