const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: {
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
        enum: ['planning', 'active', 'paused', 'completed'],
        default: 'planning'
    },
    budget: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    kpis: [{
        name: String,
        target: Number,
        current: Number,
        unit: String
    }]
}, {
    timestamps: true
});

// Virtual for progress calculation
campaignSchema.virtual('progress').get(function () {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
});

campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);
