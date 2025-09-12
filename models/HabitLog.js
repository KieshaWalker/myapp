// models/HabitLog.js — separate collection for habit logs (optional alongside subdocs)
// This model tracks log entries for habits and can be used for queries/analytics.
const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
  habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true }, // parent habit id
  date: { type: Date, default: Date.now }, // when the log occurred
  status: { type: String, enum: ['completed', 'missed'], required: true } // outcome
});

const HabitLog = mongoose.model('HabitLog', habitLogSchema);
module.exports = HabitLog;