// routes/logRoutes.js — routes for listing/creating/deleting habit logs
const express = require('express');
const router = express.Router();
const isSignedIn = require('../middleware/isSignedin.js');
const logController = require('../controllers/logController');

// Protect all log routes — user must be logged in
router.use(isSignedIn);

// GET /logs/:habitId - list logs for a habit
router.get('/:habitId', logController.listLogs);
// GET /logs/:habitId/new - show form to add log
router.get('/:habitId/new', logController.newLogForm);
// POST /logs/:habitId - create a log entry
router.post('/:habitId', logController.createLog);
// DELETE /logs/:habitId/:logId - delete a log entry
router.delete('/:habitId/:logId', logController.deleteLog);

module.exports = router;