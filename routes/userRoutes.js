// routes/userRoutes.js — auth and homepage routes
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const isSignedIn = require('../middleware/isSignedin.js');

// Registration
router.get('/register', userController.register);
// Login
router.get('/login', userController.login);
// POST create user
router.post('/register', userController.registerUser);
// POST login
router.post('/login', userController.loggedIn);
// Logout (protected)
router.get('/logout', isSignedIn, userController.signOut);
// Home/Dashboard
router.get('/', userController.home);
router.get('/home', userController.home);


module.exports = router;