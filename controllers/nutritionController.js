// controllers/nutritionController.js — proxy to Nutritionix API
// Exposes GET /nutrition?food=... returning JSON results from Nutritionix
const axios = require('axios');
const APP_ID = process.env.NUTRITIONIX_APP_ID;
const API_KEY = process.env.NUTRITIONIX_API_KEY;

// Centralized Nutritionix API call
// Given a free-text food description, returns a promise for Nutritionix response
async function fetchNutritionix(food) {
  return axios.post(
    'https://trackapi.nutritionix.com/v2/natural/nutrients',
    { query: food },
    {
      headers: {
        'x-app-id': APP_ID,
        'x-app-key': API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Controller to handle request/response
// Validates query, calls Nutritionix, returns JSON or error JSON
async function getNutrition(req, res) {
  const food = req.query.food;
  if (!food) {
    return res.status(400).json({ error: 'Missing food query parameter.' });
  }
  try {
    const response = await fetchNutritionix(food);
    return res.json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getNutrition,
  fetchNutritionix // Exported for reuse if needed
};