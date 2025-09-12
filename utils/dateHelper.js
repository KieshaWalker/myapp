// dateHelper.js — Centralized date/time helpers for habit due logic
// These helpers normalize dates to the local day and compute week/month boundaries.
// All functions here are pure utilities and do not depend on Express or Mongoose.

// Convert a UTC date string or Date to a local Date at midnight (ignores time)
// Input: Date | string; Output: Date (local midnight)
function toLocalDate(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Return start and end (exclusive) of the local day for a given Date
// Given a date (default now), return the start and "end" (exclusive) of that local day
// Useful for querying ranges like [start, end)
function getDayBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return { start, end };
}

// Get start of the current week (Sunday) - change offset for Monday if desired
// Compute the start of the week for a given date.
// Optionally use Monday as the first day (habit apps often prefer Monday start).
function getWeekStart(d = new Date(), weekStartsOnMonday = false) {
  const copy = new Date(d);
  copy.setHours(0,0,0,0);
  const day = copy.getDay(); // 0 = Sunday
  const diff = weekStartsOnMonday ? (day === 0 ? 6 : day - 1) : day; // Monday-start logic
  copy.setDate(copy.getDate() - diff);
  return copy;
}

// Get the first day of the current month for a date
function getMonthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Find the last completed log entry (status === 'completed') for a habit
// Iterate a habit's log to find the most recent 'completed' entry.
// Returns the log object or null if none.
function lastCompleted(habit) {
  if (!habit || !habit.habitLog || habit.habitLog.length === 0) return null;
  // Use a single pass reduce instead of sort for efficiency
  return habit.habitLog.reduce((acc, log) => {
    if (log.status !== 'completed') return acc;
    if (!acc) return log;
    return new Date(log.date) > new Date(acc.date) ? log : acc;
  }, null);
}

// Determine if a habit is due based on its frequency and last completion
// Determine if a habit is due based on frequency and last completion time.
// Inputs:
//  - habit: object with fields { frequency: 'daily'|'weekly'|'monthly'|'custom', habitLog: [...] }
//  - now: Date to compare against (defaults to current time)
//  - options: { weekStartsOnMonday: boolean }
function isHabitDue(habit, now = new Date(), options = { weekStartsOnMonday: false }) {
  const lc = lastCompleted(habit);
  if (!lc) return true; // Never completed => due
  const last = toLocalDate(lc.date);
  const localNow = toLocalDate(now);
  switch (habit.frequency) {
    case 'daily':
      return last.getTime() !== localNow.getTime();
    case 'weekly': {
      const weekStart = toLocalDate(getWeekStart(localNow, options.weekStartsOnMonday));
      return last < weekStart; // Not completed since current week started
    }
    case 'monthly':
      return last < toLocalDate(getMonthStart(localNow));
    default: // 'custom' or unknown => treat as due
      return true;
  }
}

module.exports = {
  getDayBounds,
  getWeekStart,
  getMonthStart,
  lastCompleted,
  isHabitDue,
  toLocalDate,
};