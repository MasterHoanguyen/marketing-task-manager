const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// GET dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Task counts by status
        const tasksByStatus = await Task.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Tasks due soon (next 7 days)
        const tasksDueSoon = await Task.find({
            dueDate: { $gte: today, $lte: nextWeek },
            status: { $ne: 'done' }
        })
            .populate('assignee', 'name')
            .populate('campaign', 'name color')
            .sort({ dueDate: 1 })
            .limit(10);

        // Overdue tasks
        const overdueTasks = await Task.find({
            dueDate: { $lt: today },
            status: { $ne: 'done' }
        })
            .populate('assignee', 'name')
            .populate('campaign', 'name color')
            .sort({ dueDate: 1 })
            .limit(10);

        // Active campaigns with progress
        const activeCampaigns = await Campaign.find({
            status: { $in: ['active', 'planning'] }
        }).sort({ startDate: -1 }).limit(5);

        // Get task stats for each campaign
        const campaignsWithProgress = await Promise.all(
            activeCampaigns.map(async (campaign) => {
                const tasks = await Task.find({ campaign: campaign._id });
                const total = tasks.length;
                const done = tasks.filter(t => t.status === 'done').length;
                const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                return {
                    ...campaign.toObject(),
                    taskStats: {
                        total,
                        done,
                        inProgress: tasks.filter(t => t.status === 'in-progress').length,
                        todo: tasks.filter(t => t.status === 'todo').length
                    },
                    progress
                };
            })
        );

        // Tasks by priority
        const tasksByPriority = await Task.aggregate([
            { $match: { status: { $ne: 'done' } } },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent activity (recently updated tasks)
        const recentActivity = await Task.find()
            .populate('assignee', 'name')
            .populate('campaign', 'name color')
            .sort({ updatedAt: -1 })
            .limit(10);

        // Team workload
        const teamWorkload = await Task.aggregate([
            { $match: { status: { $ne: 'done' }, assignee: { $ne: null } } },
            {
                $group: {
                    _id: '$assignee',
                    taskCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    name: '$user.name',
                    taskCount: 1
                }
            },
            { $sort: { taskCount: -1 } }
        ]);

        // Summary counts
        const totalTasks = await Task.countDocuments();
        const totalCampaigns = await Campaign.countDocuments();
        const totalUsers = await User.countDocuments();

        res.json({
            summary: {
                totalTasks,
                totalCampaigns,
                totalUsers,
                completedTasks: tasksByStatus.find(s => s._id === 'done')?.count || 0
            },
            tasksByStatus: tasksByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            tasksByPriority: tasksByPriority.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            tasksDueSoon,
            overdueTasks,
            activeCampaigns: campaignsWithProgress,
            recentActivity,
            teamWorkload
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET campaign analytics
router.get('/campaigns/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const tasks = await Task.find({ campaign: req.params.id })
            .populate('assignee', 'name');

        const tasksByStatus = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {});

        const tasksByLabel = tasks.reduce((acc, task) => {
            task.labels?.forEach(label => {
                acc[label] = (acc[label] || 0) + 1;
            });
            return acc;
        }, {});

        const tasksByAssignee = tasks.reduce((acc, task) => {
            if (task.assignee) {
                const name = task.assignee.name;
                acc[name] = (acc[name] || 0) + 1;
            }
            return acc;
        }, {});

        res.json({
            campaign,
            taskStats: {
                total: tasks.length,
                byStatus: tasksByStatus,
                byLabel: tasksByLabel,
                byAssignee: tasksByAssignee
            },
            progress: tasks.length > 0
                ? Math.round((tasksByStatus.done || 0) / tasks.length * 100)
                : 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
