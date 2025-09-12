// passUser.js — expose the logged-in user to views
// EJS templates read res.locals.user to customize the UI (e.g., show/hide links)
// This middleware runs for every request, setting a safe, minimal user object or null.
const passUser = (req, res, next) => {
    res.locals.user = req.session.user ? req.session.user : null;
    next();
};

module.exports = passUser;