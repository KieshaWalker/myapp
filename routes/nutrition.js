// routes/nutrition.js — proxy route to Nutritionix API
const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');

// GET /nutrition?food=banana — respond with JSON from Nutritionix
router.get('/', nutritionController.getNutrition);

module.exports = router;