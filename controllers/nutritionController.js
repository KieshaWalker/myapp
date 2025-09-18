// controllers/nutritionController.js — proxy to Nutritionix API
// Exposes GET /nutrition?food=... returning JSON results from Nutritionix
const axios = require('axios');
const APP_ID = process.env.NUTRITIONIX_APP_ID;
const API_KEY = process.env.NUTRITIONIX_API_KEY;
const NutritionModel = require('../models/nutrition/nutrition'); // Adjust path as necessary

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

async function showNutritionPage(req, res) {
  const user = req.user; 
  const nutritionData = await NutritionModel.find({ userId: user._id });
  const foodEntryId = req.params.id; // Get the food entry ID from the request parameters
  try {
    const response = await fetchNutritionix(foodEntryId);
    await NutritionModel.create({
      userId: user._id,
      food: response.data.foods[0].food_name,
      calories: response.data.foods[0].nf_calories,
      protein: response.data.foods[0].nf_protein,
      carbs: response.data.foods[0].nf_total_carbohydrate,
      fat: response.data.foods[0].nf_total_fat
    });
    res.render('nutrition.ejs', { user, nutritionData });
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    res.status(500).send('Internal Server Error');
  }   

}

async function listNutritionEntries(req, res) {
  const user = req.user; 
  try {
    const nutritionData = await NutritionModel.find({ userId: user._id });
    
    res.render('nutrition.ejs', { user, nutritionData });
  } catch (error) {
    console.error('Error fetching nutrition entries:', error);
    res.status(500).send('Internal Server Error');
  }   
}// this function is to list all nutrition entries for the logged-in user

async function deleteNutritionEntry(req, res) {
  const user = req.user;
  const entryId = req.params.id;
  try {
    await NutritionModel.deleteOne({ _id: entryId, userId: user._id });
    res.redirect('/nutrition');
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    res.status(500).send('Internal Server Error');
  }
} // this function is to delete a specific nutrition entry by its ID



module.exports = {
  deleteNutritionEntry,
  listNutritionEntries,
  showNutritionPage,
  getNutrition,
  fetchNutritionix // Exported for reuse if needed
};