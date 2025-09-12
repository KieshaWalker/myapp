const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  food: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  date: { type: Date, default: Date.now }
});

const Nutritions = mongoose.model('Nutrition', nutritionSchema);

module.exports = Nutritions;
