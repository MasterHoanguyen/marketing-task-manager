const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Task = require('../models/Task');

// GET all campaigns
router.get('/', async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .populate('owner', 'name email avatar')
            .sort({ createdAt: -1 });
        res.json(campaigns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single campaign with task counts
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('owner', 'name email avatar');
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        // Get task statistics
        const taskStats = await Task.aggregate([
            { $match: { campaign: campaign._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = {
            todo: 0,
            'in-progress': 0,
            review: 0,
            done: 0
        };
        taskStats.forEach(s => { stats[s._id] = s.count; });

        res.json({ ...campaign.toJSON(), taskStats: stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create campaign
router.post('/', async (req, res) => {
    try {
        const campaign = new Campaign(req.body);
        await campaign.save();
        res.status(201).json(campaign);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update campaign
router.put('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        res.json(campaign);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE campaign and its tasks
router.delete('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

        // Delete all tasks in this campaign
        await Task.deleteMany({ campaign: req.params.id });

        res.json({ message: 'Campaign and tasks deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
