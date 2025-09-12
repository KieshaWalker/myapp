// models/habitica.js — simple Habitica API helper using environment credentials
// Note: We also have utils/habiticaClient.js which uses per-user credentials.
// This file is kept for reference; prefer the utils variant for multi-user apps.
const axios = require('axios');

const USER_ID = process.env.HABITICA_USER_ID; // your Habitica account id (from .env)
const API_TOKEN = process.env.HABITICA_API_TOKEN; // your Habitica API token (from .env)

const habiticaApi = axios.create({
  baseURL: 'https://habitica.com/api/v3',
  headers: {
    'x-api-user': USER_ID,
    'x-api-key': API_TOKEN,
    'Content-Type': 'application/json',
  }
});

module.exports = {
  // Create a new habit
  // Create a new Habitica habit with given display text
  async createHabit(text) {
    const response = await habiticaApi.post('/tasks/user', {
      text,
      type: 'habit'
    });
    return response.data;
  },

  // Get all user tasks
  // Retrieve all tasks for the configured Habitica user
  async getTasks() {
    const response = await habiticaApi.get('/tasks/user');
    return response.data;
  },

  // Score (check off) a habit
  // Score a habit up or down by task id
  async scoreTask(taskId, direction = 'up') {
    const response = await habiticaApi.post(`/tasks/${taskId}/score/${direction}`);
    return response.data;
  }
};