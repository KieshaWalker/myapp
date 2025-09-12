// habiticaClient.js — minimal wrapper around the Habitica REST API
// These helpers expect a user object with Habitica credentials (userId, apiToken) on user.habitica.
const axios = require('axios');

const BASE = process.env.HABITICA_API_BASE || 'https://habitica.com/api/v3';
const X_CLIENT = process.env.HABITICA_CLIENT || 'myapp-local';

// Build auth headers required by Habitica for a given user
function buildHeaders(user) {
  if (!user || !user.habitica || !user.habitica.userId || !user.habitica.apiToken) {
    throw new Error('Habitica credentials missing');
  }
  return {
    'x-api-user': user.habitica.userId,
    'x-api-key': user.habitica.apiToken,
    'x-client': X_CLIENT,
    'Content-Type': 'application/json'
  };
}

// Create a Habitica task (habit/daily/todo/reward) for the user
async function createTask(user, payload) {
  const headers = buildHeaders(user);
  const res = await axios.post(`${BASE}/tasks/user`, payload, { headers });
  return res.data && res.data.data; // Habitica returns { success, data }
}

// Update an existing Habitica task by id
async function updateTask(user, taskId, payload) {
  const headers = buildHeaders(user);
  const res = await axios.put(`${BASE}/tasks/${taskId}`, payload, { headers });
  return res.data && res.data.data;
}

// Score (check off) a Habitica task in the given direction ('up' or 'down')
async function scoreTask(user, taskId, direction = 'up') {
  const headers = buildHeaders(user);
  const dir = direction === 'down' ? 'down' : 'up';
  const res = await axios.post(`${BASE}/tasks/${taskId}/score/${dir}`, {}, { headers });
  return res.data && res.data.data;
}

// Delete a Habitica task by id
async function deleteTask(user, taskId) {
  const headers = buildHeaders(user);
  const res = await axios.delete(`${BASE}/tasks/${taskId}`, { headers });
  return res.data && res.data.data;
}

module.exports = {
  createTask,
  updateTask,
  scoreTask,
  deleteTask,
};
