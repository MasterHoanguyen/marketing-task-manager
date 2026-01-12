const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks (with filters)
router.get('/', async (req, res) => {
    try {
        const { campaign, status, assignee, label, startDate, endDate } = req.query;
        const filter = {};

        if (campaign) filter.campaign = campaign;
        if (status) filter.status = status;
        if (assignee) filter.assignee = assignee;
        if (label) filter.labels = label;

        // Content calendar date range filter
        if (startDate && endDate) {
            filter.scheduledDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const tasks = await Task.find(filter)
            .populate('assignee', 'name email avatar')
            .populate('campaign', 'name color')
            .sort({ order: 1, createdAt: -1 });

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET tasks for calendar view
router.get('/calendar', async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const tasks = await Task.find({
            scheduledDate: { $gte: startDate, $lte: endDate }
        })
            .populate('assignee', 'name avatar')
            .populate('campaign', 'name color')
            .sort({ scheduledDate: 1 });

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single task
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignee', 'name email avatar')
            .populate('campaign', 'name color')
            .populate('comments.user', 'name avatar');
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create task
router.post('/', async (req, res) => {
    try {
        // Get max order for this campaign and status
        const maxOrder = await Task.findOne({
            campaign: req.body.campaign,
            status: req.body.status || 'todo'
        }).sort({ order: -1 });

        const task = new Task({
            ...req.body,
            order: maxOrder ? maxOrder.order + 1 : 0
        });
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('assignee', 'name email avatar')
            .populate('campaign', 'name color');

        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update task
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('assignee', 'name email avatar')
            .populate('campaign', 'name color');

        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH update task status (for drag & drop)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, order } = req.body;
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { status, order },
            { new: true }
        )
            .populate('assignee', 'name email avatar')
            .populate('campaign', 'name color');

        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST add comment to task
router.post('/:id/comments', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        task.comments.push(req.body);
        await task.save();

        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT reorder tasks
router.put('/reorder/batch', async (req, res) => {
    try {
        const { tasks } = req.body; // Array of { id, status, order }

        const bulkOps = tasks.map(t => ({
            updateOne: {
                filter: { _id: t.id },
                update: { status: t.status, order: t.order }
            }
        }));

        await Task.bulkWrite(bulkOps);
        res.json({ message: 'Tasks reordered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
