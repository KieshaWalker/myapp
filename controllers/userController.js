// controllers/userController.js — auth and user homepage handlers
// Includes HTML and JSON-aware responses for easier API testing.
const bcrypt = require('bcrypt');



const User = require('../models/User');
const Habit = require('../models/Habit');
// const { isHabitDue } = require('../utils/dateHelper');

// Render user homepage if signed in, else redirect to login
// GET /users or /users/home
const home = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect('/users/login');
    }
    const habits = await Habit.find({ user: req.session.user._id, archived: false }).lean();
    return res.render('users/homepage.ejs', { user: req.session.user, habits });
  } catch (err) {
    console.log(err);
    return res.redirect('/');
  }
};

// Render login form
// GET /users/login
const login = (req, res) => {
    console.log('Rendering login page');
    res.render('users/signin.ejs');
};

// Render registration form
// GET /users/register
const register = (req, res) => {
    console.log('Register request received:');
    res.render('users/register.ejs');
};

// Helper: detect if request prefers JSON responses
function wantsJSON(req) {
  return req.is('application/json') || (req.get('accept') && req.get('accept').includes('application/json'));
}

// Handle registration (hash password, basic validation)
// POST /users/register
const registerUser = async (req, res) => {
    try {
    // Check if the username is already taken
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      if (wantsJSON(req)) return res.status(409).json({ error: 'Username already taken' });
      return res.send('Username already taken.');
    }
  
    // Username is not taken already!
    // Check if the password and confirm password match
    if (req.body.password !== req.body.confirmPassword) {
      if (wantsJSON(req)) return res.status(400).json({ error: 'Password and Confirm Password must match' });
      return res.send('Password and Confirm Password must match');
    }
  
    // Must hash the password before sending to the database
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;
  
    // All ready to create the new user!
  await User.create(req.body);
    if (wantsJSON(req)) {
      return res.status(201).json({ message: 'User created', username: req.body.username });
    }
    res.redirect('/users/login');
  } catch (error) {
    console.log(error);
    if (wantsJSON(req)) return res.status(500).json({ error: 'Internal Server Error' });
    res.render('users/homepage.ejs');
  }
  }


// Handle login: verify password, create minimal session, return homepage
// POST /users/login
const loggedIn = async (req, res) => {
    console.log('Login request received:', req.body);
 try {
    // First, get the user from the database
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (!userInDatabase) {
      if (wantsJSON(req)) return res.status(401).json({ error: 'Login failed' });
      return res.send('Login failed. Please try again.');
    }
  
    // There is a user! Time to test their password with bcrypt
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );

    if (!validPassword) {
      if (wantsJSON(req)) return res.status(401).json({ error: 'Invalid password' });
      return res.send('Invalid password. please try again.');
    }
  
    // There is a user AND they had the correct password. Time to make a session!
    // Avoid storing the password, even in hashed format, in the session
    // If there is other data you want to save to `req.session.user`, do so here!
    req.session.user = { username: userInDatabase.username, _id: userInDatabase._id };
  const habits = await Habit.find({ user: userInDatabase._id, archived: false }).lean();
  if (wantsJSON(req)) return res.json({ message: 'Logged in', user: req.session.user, habits });
  return res.render('users/homepage.ejs', { user: req.session.user, habits });

  } catch (error) {
    console.log(error);
    if (wantsJSON(req)) return res.status(500).json({ error: 'Internal Server Error' });
    res.redirect('/');
  }
};


// Destroy the session and redirect to home
// GET /users/logout
const signOut = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log('Error signing out:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
};

module.exports = {
  home,
    register,
    login,
    registerUser,
    loggedIn,
    signOut

};