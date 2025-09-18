// routes/nutrition.js — proxy route to Nutritionix API
const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');

// GET /nutrition?food=banana — respond with JSON from Nutritionix
router.get('/', nutritionController.getNutrition);

router.get('/testing', nutritionController.showNutritionPage);

router.get('/entries', nutritionController.listNutritionEntries);
router.put('/entries/:id', nutritionController.showNutritionPage);
router.delete('/entries/:id', nutritionController.deleteNutritionEntry);


module.exports = router;