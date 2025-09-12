// isSignedin.js — route guard middleware
// This middleware protects routes that require authentication.
// If a user session exists, we allow the request to continue; otherwise, redirect to home/login.
const isSignedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        console.log('User is signed in:', req.session.user);
        return next();
    }
    console.log('User is not signed in. Redirecting to sign-in page.');
    return res.redirect('/');
};

module.exports = isSignedIn;