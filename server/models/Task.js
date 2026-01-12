const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    labels: [{
        type: String,
        enum: ['content', 'seo', 'ads', 'social', 'email', 'event', 'design', 'video']
    }],
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dueDate: {
        type: Date
    },
    scheduledDate: {
        type: Date  // For content calendar
    },
    order: {
        type: Number,
        default: 0
    },
    checklist: [{
        text: String,
        completed: { type: Boolean, default: false }
    }],
    attachments: [{
        name: String,
        url: String
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Check if task is overdue
taskSchema.virtual('isOverdue').get(function () {
    if (!this.dueDate) return false;
    return new Date() > new Date(this.dueDate) && this.status !== 'done';
});

taskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
