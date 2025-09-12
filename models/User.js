// models/User.js — application user accounts
// Stores login credentials (hashed password), embedded habits, and Habitica credentials.
const mongoose = require('mongoose');

const habitSchema = require('./Habit').schema;


const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    habits: [habitSchema], // embedded copy of habits for quick access (also stored as separate collection)
    habitica: {
        enabled: { type: Boolean, default: false }, // toggle integration
        userId: { type: String }, // Habitica account ID
        apiToken: { type: String }, // Habitica API token (treat as secret)
    }
})

const User = mongoose.model('User', userSchema);
module.exports = User;