// routes/habitRoutes.js — routes for habit CRUD and completion
const express = require('express');
const router = express.Router();

const habitController = require('../controllers/habitController');
const isSignedIn = require('../middleware/isSignedin.js');
// Protect all habit routes — user must be logged in
router.use(isSignedIn);

// GET /habits — list user's habits
router.get('/', habitController.showAddHabit);
// GET /habits/new — show form to create a habit
router.get('/new', habitController.showNewHabit);

// Convenience: support /habits/edit?id=... by redirecting to /habits/:id/edit
router.get('/edit', (req, res) => {
	const id = req.query.id;
	if (id) return res.redirect(`/habits/${id}/edit`);
	return res.redirect('/habits');
});

// POST /habits — create a habit
router.post('/', habitController.createHabit);
// POST /habits/:id/complete — mark a habit complete today
router.post('/:id/complete', habitController.completeHabit);

// GET /habits/:id/edit — show edit form for habit
router.get('/:id/edit', habitController.showEditHabit);
// PUT /habits/:id — update habit
router.put('/:id', habitController.updateHabit);

// DELETE /habits/:id — delete habit
router.delete('/:id', habitController.deleteHabit);

module.exports = router;