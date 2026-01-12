/**
 * Dashboard Module - Tổng quan và thống kê
 */
const Dashboard = {
    data: null,

    // Khởi tạo Dashboard
    async init() {
        console.log('📊 Dashboard module initialized');
    },

    // Tải và render Dashboard
    async load() {
        try {
            UI.showLoading('dashboardContent');
            this.data = await API.stats.getDashboard();
            this.render();
        } catch (error) {
            console.error('Dashboard load error:', error);
            UI.showEmptyState('dashboardContent', '📊', 'Không thể tải dữ liệu thống kê');
        }
    },

    // Render Dashboard
    render() {
        const container = document.getElementById('dashboardContent');
        if (!this.data) return;

        const { summary, tasksByStatus, tasksByPriority, tasksDueSoon, overdueTasks, activeCampaigns, recentActivity, teamWorkload } = this.data;

        container.innerHTML = `
            <!-- Summary Cards -->
            <div class="dashboard-summary">
                <div class="summary-card gradient-primary">
                    <div class="summary-icon">📋</div>
                    <div class="summary-content">
                        <div class="summary-value">${summary.totalTasks}</div>
                        <div class="summary-label">Tổng Công Việc</div>
                    </div>
                </div>
                <div class="summary-card gradient-success">
                    <div class="summary-icon">✅</div>
                    <div class="summary-content">
                        <div class="summary-value">${summary.completedTasks}</div>
                        <div class="summary-label">Hoàn Thành</div>
                    </div>
                </div>
                <div class="summary-card gradient-warning">
                    <div class="summary-icon">🚀</div>
                    <div class="summary-content">
                        <div class="summary-value">${summary.totalCampaigns}</div>
                        <div class="summary-label">Chiến Dịch</div>
                    </div>
                </div>
                <div class="summary-card gradient-info">
                    <div class="summary-icon">👥</div>
                    <div class="summary-content">
                        <div class="summary-value">${summary.totalUsers}</div>
                        <div class="summary-label">Thành Viên</div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="dashboard-row">
                <!-- Task Status Chart -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>📊 Trạng Thái Công Việc</h3>
                    </div>
                    <div class="card-body">
                        ${this.renderStatusChart(tasksByStatus)}
                    </div>
                </div>

                <!-- Priority Distribution -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>🎯 Theo Độ Ưu Tiên</h3>
                    </div>
                    <div class="card-body">
                        ${this.renderPriorityBars(tasksByPriority)}
                    </div>
                </div>
            </div>

            <!-- Due Soon & Overdue Row -->
            <div class="dashboard-row">
                <!-- Due Soon -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>⏰ Sắp Đến Hạn</h3>
                        <span class="badge badge-warning">${tasksDueSoon.length}</span>
                    </div>
                    <div class="card-body">
                        ${this.renderTaskList(tasksDueSoon, 'due')}
                    </div>
                </div>

                <!-- Overdue -->
                <div class="dashboard-card ${overdueTasks.length > 0 ? 'card-danger' : ''}">
                    <div class="card-header">
                        <h3>🚨 Quá Hạn</h3>
                        <span class="badge badge-danger">${overdueTasks.length}</span>
                    </div>
                    <div class="card-body">
                        ${overdueTasks.length > 0
                ? this.renderTaskList(overdueTasks, 'overdue')
                : '<div class="empty-message">🎉 Không có công việc quá hạn!</div>'
            }
                    </div>
                </div>
            </div>

            <!-- Campaigns & Team Row -->
            <div class="dashboard-row">
                <!-- Active Campaigns -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>🚀 Chiến Dịch Đang Chạy</h3>
                    </div>
                    <div class="card-body">
                        ${this.renderCampaignList(activeCampaigns)}
                    </div>
                </div>

                <!-- Team Workload -->
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>👥 Khối Lượng Công Việc</h3>
                    </div>
                    <div class="card-body">
                        ${this.renderTeamWorkload(teamWorkload)}
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="dashboard-card full-width">
                <div class="card-header">
                    <h3>📝 Hoạt Động Gần Đây</h3>
                </div>
                <div class="card-body">
                    ${this.renderActivityTimeline(recentActivity)}
                </div>
            </div>
        `;

        // Add animation delay to cards
        container.querySelectorAll('.dashboard-card, .summary-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
        });
    },

    // Render Status Chart (Donut-style)
    renderStatusChart(stats) {
        const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
        const statusColors = {
            'todo': { color: '#6366f1', label: 'Cần Làm', icon: '📥' },
            'in-progress': { color: '#f59e0b', label: 'Đang Làm', icon: '⚡' },
            'review': { color: '#3b82f6', label: 'Đang Duyệt', icon: '👀' },
            'done': { color: '#10b981', label: 'Hoàn Thành', icon: '✅' }
        };

        const items = Object.entries(statusColors).map(([key, config]) => {
            const count = stats[key] || 0;
            const percent = Math.round((count / total) * 100);
            return { key, count, percent, ...config };
        });

        return `
            <div class="status-chart">
                <div class="chart-visual">
                    <div class="donut-chart">
                        ${this.createDonutSegments(items)}
                        <div class="donut-center">
                            <span class="donut-total">${total}</span>
                            <span class="donut-label">Công việc</span>
                        </div>
                    </div>
                </div>
                <div class="chart-legend">
                    ${items.map(item => `
                        <div class="legend-item">
                            <span class="legend-color" style="background: ${item.color}"></span>
                            <span class="legend-text">${item.icon} ${item.label}</span>
                            <span class="legend-value">${item.count} (${item.percent}%)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Create CSS donut segments
    createDonutSegments(items) {
        let rotation = 0;
        const segments = items.map(item => {
            const segmentDeg = (item.percent / 100) * 360;
            const segment = `
                <div class="donut-segment" style="
                    --rotation: ${rotation}deg;
                    --segment: ${segmentDeg}deg;
                    --color: ${item.color};
                "></div>
            `;
            rotation += segmentDeg;
            return segment;
        }).join('');

        return segments;
    },

    // Render Priority Bars
    renderPriorityBars(stats) {
        const priorities = [
            { key: 'urgent', label: 'Khẩn cấp', color: '#ef4444', icon: '🔴' },
            { key: 'high', label: 'Cao', color: '#f97316', icon: '🟠' },
            { key: 'medium', label: 'Trung bình', color: '#eab308', icon: '🟡' },
            { key: 'low', label: 'Thấp', color: '#22c55e', icon: '🟢' }
        ];

        const maxCount = Math.max(...Object.values(stats), 1);

        return `
            <div class="priority-bars">
                ${priorities.map(p => {
            const count = stats[p.key] || 0;
            const percent = Math.round((count / maxCount) * 100);
            return `
                        <div class="priority-bar-item">
                            <div class="priority-info">
                                <span>${p.icon} ${p.label}</span>
                                <span class="priority-count">${count}</span>
                            </div>
                            <div class="priority-bar">
                                <div class="priority-fill" style="width: ${percent}%; background: ${p.color}"></div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    // Render Task List
    renderTaskList(tasks, type) {
        if (tasks.length === 0) {
            return '<div class="empty-message">Không có công việc</div>';
        }

        return `
            <div class="task-list-compact">
                ${tasks.map(task => `
                    <div class="task-list-item ${type === 'overdue' ? 'overdue' : ''}" data-id="${task._id}">
                        <div class="task-list-info">
                            <span class="task-list-title">${task.title}</span>
                            ${task.campaign ? `<span class="task-list-campaign" style="border-color: ${task.campaign.color}">${task.campaign.name}</span>` : ''}
                        </div>
                        <div class="task-list-meta">
                            ${task.assignee ? `<span class="task-list-assignee">${task.assignee.name}</span>` : ''}
                            <span class="task-list-date ${type === 'overdue' ? 'text-danger' : ''}">${UI.formatDate(task.dueDate)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Render Campaign List
    renderCampaignList(campaigns) {
        if (campaigns.length === 0) {
            return '<div class="empty-message">Chưa có chiến dịch đang chạy</div>';
        }

        return `
            <div class="campaign-list-compact">
                ${campaigns.map(c => `
                    <div class="campaign-list-item">
                        <div class="campaign-list-header">
                            <span class="campaign-dot-lg" style="background: ${c.color}"></span>
                            <span class="campaign-list-name">${c.name}</span>
                            <span class="campaign-list-status ${c.status}">${UI.getStatusIcon(c.status)}</span>
                        </div>
                        <div class="campaign-list-progress">
                            <div class="mini-progress-bar">
                                <div class="mini-progress-fill" style="width: ${c.progress}%"></div>
                            </div>
                            <span class="progress-text">${c.progress}%</span>
                        </div>
                        <div class="campaign-list-stats">
                            <span>📥 ${c.taskStats?.todo || 0}</span>
                            <span>⚡ ${c.taskStats?.inProgress || 0}</span>
                            <span>✅ ${c.taskStats?.done || 0}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Render Team Workload
    renderTeamWorkload(workload) {
        if (workload.length === 0) {
            return '<div class="empty-message">Chưa có dữ liệu</div>';
        }

        const maxTasks = Math.max(...workload.map(w => w.taskCount), 1);

        return `
            <div class="workload-list">
                ${workload.map(member => {
            const percent = Math.round((member.taskCount / maxTasks) * 100);
            const level = member.taskCount > 5 ? 'high' : member.taskCount > 3 ? 'medium' : 'low';
            return `
                        <div class="workload-item">
                            <div class="workload-avatar">${member.name?.charAt(0)?.toUpperCase() || '?'}</div>
                            <div class="workload-info">
                                <div class="workload-name">${member.name}</div>
                                <div class="workload-bar">
                                    <div class="workload-fill ${level}" style="width: ${percent}%"></div>
                                </div>
                            </div>
                            <div class="workload-count">${member.taskCount} việc</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    // Render Activity Timeline
    renderActivityTimeline(activities) {
        if (activities.length === 0) {
            return '<div class="empty-message">Chưa có hoạt động</div>';
        }

        return `
            <div class="activity-timeline">
                ${activities.map(task => `
                    <div class="activity-item">
                        <div class="activity-icon">${UI.getStatusIcon(task.status)}</div>
                        <div class="activity-content">
                            <span class="activity-title">${task.title}</span>
                            <span class="activity-meta">
                                ${task.assignee ? `👤 ${task.assignee.name}` : ''}
                                ${task.campaign ? `📁 ${task.campaign.name}` : ''}
                            </span>
                        </div>
                        <div class="activity-time">${UI.formatTimeAgo(task.updatedAt)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
