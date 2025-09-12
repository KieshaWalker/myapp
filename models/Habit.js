// models/Habit.js — Mongoose model representing a user's habit
// Each habit can be synced to Habitica (optional) and has local completion logs.
const mongoose = require('mongoose');

// Subdocument for an individual habit log entry (e.g., completion status on a date)
const habitLogSubSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now }, // when this log was recorded
  status: { type: String, enum: ['completed', 'missed'], required: true } // outcome for that date
}, { _id: true });

const habitSchema = new mongoose.Schema({
  // Core app fields
  title: { type: String, required: true },
  description: { type: String },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], default: 'daily' },
  targetCount: { type: Number, default: 1 },
  duration: { type: Number, default: 0 },
  archived: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitLog: { type: [habitLogSubSchema], default: [] },
  createdAt: { type: Date, default: Date.now },

  // Habitica mapping fields
  habiticaTaskId: { type: String, index: true },
  habiticaType: { type: String, enum: ['habit', 'daily', 'todo', 'reward'], default: 'habit' },
  habiticaUp: { type: Boolean, default: true }, // allow positive scoring
  habiticaDown: { type: Boolean, default: true }, // allow negative scoring
  habiticaPriority: { type: Number, enum: [0.1, 1, 1.5, 2], default: 1 }, // trivial, easy, medium, hard
  habiticaAttribute: { type: String, enum: ['str', 'int', 'con', 'per'], default: 'str' }, // attribute weighting
  habiticaTags: { type: [String], default: [] }, // tag IDs in Habitica
  habiticaNotes: { type: String },
  habiticaSyncedAt: { type: Date },
  habiticaSyncError: { type: String },
}, { timestamps: true });

// Instance: build a Habitica task payload from this Habit
// Build a Habitica-compatible payload based on this habit's fields
habitSchema.methods.toHabiticaPayload = function toHabiticaPayload() {
  return {
    text: this.title,
    notes: this.description || this.habiticaNotes || '',
    type: this.habiticaType || 'habit',
    priority: this.habiticaPriority || 1,
    attribute: this.habiticaAttribute || 'str',
    up: this.habiticaUp !== false,
    down: this.habiticaDown !== false,
    tags: Array.isArray(this.habiticaTags) ? this.habiticaTags : [],
  };
};

// Instance: apply fields from a Habitica task response onto this model (does not save)
// Apply fields from a Habitica API task response to this model (does not save)
habitSchema.methods.applyHabiticaTask = function applyHabiticaTask(task) {
  if (!task) return this;
  this.habiticaTaskId = task.id || this.habiticaTaskId;
  this.title = task.text || this.title;
  this.habiticaNotes = task.notes ?? this.habiticaNotes;
  this.habiticaType = task.type || this.habiticaType;
  this.habiticaPriority = typeof task.priority === 'number' ? task.priority : this.habiticaPriority;
  this.habiticaAttribute = task.attribute || this.habiticaAttribute;
  this.habiticaUp = typeof task.up === 'boolean' ? task.up : this.habiticaUp;
  this.habiticaDown = typeof task.down === 'boolean' ? task.down : this.habiticaDown;
  if (Array.isArray(task.tags)) this.habiticaTags = task.tags.map(t => (typeof t === 'string' ? t : t.id)).filter(Boolean);
  return this;
};

// Mark the habit as synced with Habitica at the current time
habitSchema.methods.markHabiticaSynced = function markHabiticaSynced(taskId) {
  this.habiticaTaskId = taskId || this.habiticaTaskId;
  this.habiticaSyncedAt = new Date();
  this.habiticaSyncError = undefined;
  return this;
};

// Record a sync error message for troubleshooting
habitSchema.methods.markHabiticaSyncError = function markHabiticaSyncError(message) {
  this.habiticaSyncError = message || 'Unknown sync error';
  return this;
};

const Habit = mongoose.model('Habit', habitSchema);
module.exports = Habit;