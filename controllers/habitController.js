// controllers/habitController.js — handlers for habit CRUD and completion
// This file also performs best-effort syncing to Habitica when enabled per user.
const Habit = require('../models/Habit');
const { isHabitDue } = require('../utils/dateHelper');
const User = require('../models/User');
const habitica = require('../utils/habiticaClient');

// Show a standalone "new habit" form
// GET /habits/new
const showNewHabit = async (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('User is not logged in');
    return res.render('habits/new.ejs', { user });
};

// Show list of habits (simple index + create form)
// GET /habits
const showAddHabit = async (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).send('User is not logged in');
    const habits = await Habit.find({ user: user._id }).lean();
    res.render('habits/index.ejs', { user, habits });
};

// Create a habit (and best-effort create in Habitica)
// POST /habits
const createHabit = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).send('User is not logged in');

        const habit = new Habit({
            title: req.body.title,
            description: req.body.description,
            frequency: req.body.frequency,
            targetCount: req.body.targetCount,
            duration: req.body.duration,
            user: user._id,
            createdAt: Date.now(),
                        // Habitica fields from form
                        habiticaType: req.body.habiticaType || 'habit',
                        habiticaUp: typeof req.body.habiticaUp !== 'undefined',
                        habiticaDown: typeof req.body.habiticaDown !== 'undefined',
                        habiticaPriority: req.body.habiticaPriority ? parseFloat(req.body.habiticaPriority) : undefined,
                        habiticaAttribute: req.body.habiticaAttribute || undefined,
                        habiticaNotes: req.body.habiticaNotes || undefined,
                        habiticaTags: req.body.habiticaTags
                            ? req.body.habiticaTags.split(',').map(t => t.trim()).filter(Boolean)
                            : undefined,
        });

        await habit.save();

    // Best-effort create task in Habitica if user enabled integration
        try {
            const dbUser = await User.findById(user._id).lean();
            if (dbUser && dbUser.habitica && dbUser.habitica.enabled) {
                const task = await habitica.createTask(dbUser, habit.toHabiticaPayload());
                if (task && (task.id || task._id)) {
                    habit.markHabiticaSynced(task.id || task._id);
                    await habit.save();
                }
            }
        } catch (e) {
            console.warn('Habitica createTask failed:', e.message);
            try { habit.markHabiticaSyncError(e.message); await habit.save(); } catch {}
        }

        console.log('Habit created successfully:', habit);

        // Load updated list
        const habits = await Habit.find({ user: user._id }).lean();
        return res.render('users/homepage.ejs', {
            user: req.session.user,
            habits
        });
    } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Mark a habit as completed for today (and best-effort score in Habitica)
// POST /habits/:id/complete
const completeHabit = async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, user: req.session.user._id });
        if (!habit) return res.status(404).send('Habit not found');

        habit.habitLog.push({ date: new Date(), status: 'completed' });
        await habit.save();

    // Best-effort score in Habitica — if linked task id exists, score 'up'
        try {
            const dbUser = await User.findById(req.session.user._id).lean();
            if (dbUser && dbUser.habitica && dbUser.habitica.enabled && habit.habiticaTaskId) {
                await habitica.scoreTask(dbUser, habit.habiticaTaskId, 'up');
                habit.markHabiticaSynced();
                await habit.save();
            }
        } catch (e) {
            console.warn('Habitica scoreTask failed:', e.message);
            try { habit.markHabiticaSyncError(e.message); await habit.save(); } catch {}
        }

        const habits = await Habit.find({ user: req.session.user._id }).lean();
        const now = new Date();
        const dueHabits = habits.filter(h => isHabitDue(h, now));
        res.render('users/homepage.ejs', { user: req.session.user, habits: dueHabits });
    } catch (error) {
        console.error('Error completing habit:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Show the edit form for a single habit
// GET /habits/:id/edit
const showEditHabit = async (req, res) => {
    console.log('Showing edit form for habit:', req.params.id);
    const user = req.session.user;
    if (!user) return res.status(401).send('User is not logged in');

    const habit = await Habit.findOne({ _id: req.params.id, user: user._id });
    if (!habit) return res.status(404).send('Not found');

    res.render('habits/edit.ejs', { habit });
};

// Update a habit (and best-effort update in Habitica)
// PUT /habits/:id
const updateHabit = async (req, res) => {
    console.log('Updating habit:', req.params.id, 'with data:', req.body);
    try {
        const user = req.session.user;
        if (!user) return res.status(401).send('User is not logged in');
        const habit = await Habit.findOne({ _id: req.params.id, user: user._id });
        if (!habit) return res.status(404).send('Not found');

        habit.title = req.body.title;
        habit.description = req.body.description;
        habit.frequency = req.body.frequency;
        habit.targetCount = req.body.targetCount;
        habit.duration = req.body.duration;

        // Update Habitica fields from form
        if (typeof req.body.habiticaType !== 'undefined') habit.habiticaType = req.body.habiticaType;
        habit.habiticaUp = typeof req.body.habiticaUp !== 'undefined';
        habit.habiticaDown = typeof req.body.habiticaDown !== 'undefined';
        if (typeof req.body.habiticaPriority !== 'undefined' && req.body.habiticaPriority !== '') {
            habit.habiticaPriority = parseFloat(req.body.habiticaPriority);
        }
        if (typeof req.body.habiticaAttribute !== 'undefined') {
            habit.habiticaAttribute = req.body.habiticaAttribute;
        }
        if (typeof req.body.habiticaNotes !== 'undefined') {
            habit.habiticaNotes = req.body.habiticaNotes;
        }
        if (typeof req.body.habiticaTags !== 'undefined') {
            habit.habiticaTags = req.body.habiticaTags
                ? req.body.habiticaTags.split(',').map(t => t.trim()).filter(Boolean)
                : [];
        }

        await habit.save();

    // Best-effort update in Habitica — update existing task or create if missing
        try {
            const dbUser = await User.findById(user._id).lean();
            if (dbUser && dbUser.habitica && dbUser.habitica.enabled) {
                const payload = habit.toHabiticaPayload();
                if (habit.habiticaTaskId) {
                    await habitica.updateTask(dbUser, habit.habiticaTaskId, payload);
                    habit.markHabiticaSynced();
                } else {
                    const task = await habitica.createTask(dbUser, payload);
                    if (task && (task.id || task._id)) {
                        habit.markHabiticaSynced(task.id || task._id);
                    }
                }
                await habit.save();
            }
        } catch (e) {
            console.warn('Habitica updateTask failed:', e.message);
            try { habit.markHabiticaSyncError(e.message); await habit.save(); } catch {}
        }

        console.log('Habit updated successfully:', habit);
        // Load updated list
        const habits = await Habit.find({ user: user._id }).lean();
        return res.render('users/homepage.ejs', {
            user: req.session.user,
            habits,
            updatedHabit: habit
        });
    } catch (error) {
        console.error('Error updating habit:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Delete a habit (and best-effort delete in Habitica)
// DELETE /habits/:id
const deleteHabit = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) return res.status(401).send('User is not logged in');
        const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: user._id });
        if (!habit) return res.status(404).send('Habit not found');

        // Best-effort delete in Habitica
        try {
            const dbUser = await User.findById(user._id).lean();
            if (dbUser && dbUser.habitica && dbUser.habitica.enabled && habit.habiticaTaskId) {
                await habitica.deleteTask(dbUser, habit.habiticaTaskId);
            }
        } catch (e) {
            console.warn('Habitica deleteTask failed:', e.message);
        }

        const habits = await Habit.find({ user: user._id }).lean();
        res.render('users/homepage.ejs', { user, habits });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    showNewHabit,
    showAddHabit,
    createHabit,
    completeHabit,
    updateHabit,
    showEditHabit,
    deleteHabit
};