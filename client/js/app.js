/**
 * Main App Module - Khởi tạo ứng dụng và quản lý state
 */
const App = {
    state: {
        currentView: 'dashboard',
        currentCampaign: null,
        campaigns: [],
        users: []
    },

    // Khởi tạo ứng dụng
    async init() {
        console.log('🚀 Marketing Task Manager đang khởi động...');

        try {
            // Tải dữ liệu ban đầu
            await this.loadCampaigns();
            await this.loadUsers();

            // Khởi tạo các modules
            await Dashboard.init();
            await Board.init();
            await Calendar.init();

            // Thiết lập navigation
            this.setupNavigation();
            this.setupCampaignModal();

            // Tải Dashboard lần đầu
            await Dashboard.load();

            // Tạo dữ liệu mẫu nếu trống
            if (this.state.campaigns.length === 0) {
                await this.createSampleData();
            }

            console.log('✅ Ứng dụng đã khởi động thành công');
        } catch (error) {
            console.error('❌ Không thể khởi động ứng dụng:', error);
            UI.toast('Không thể kết nối server. Vui lòng đảm bảo MongoDB đang chạy.', 'error');
        }
    },

    // Tải chiến dịch
    async loadCampaigns() {
        try {
            this.state.campaigns = await API.campaigns.getAll();
            this.renderCampaignList();
            this.populateCampaignSelect();
        } catch (error) {
            console.error('Không thể tải chiến dịch:', error);
        }
    },

    // Tải người dùng
    async loadUsers() {
        try {
            this.state.users = await API.users.getAll();
            this.populateUserSelect();
        } catch (error) {
            console.error('Không thể tải người dùng:', error);
        }
    },

    // Render danh sách chiến dịch trong sidebar
    renderCampaignList() {
        const list = document.getElementById('campaignList');

        if (this.state.campaigns.length === 0) {
            list.innerHTML = '<div class="empty-text" style="padding: 8px; color: var(--text-muted); font-size: 12px;">Chưa có chiến dịch</div>';
            return;
        }

        list.innerHTML = `
      <div class="campaign-item ${!this.state.currentCampaign ? 'active' : ''}" data-id="">
        <span class="campaign-dot" style="background: var(--text-muted)"></span>
        <span>Tất Cả Chiến Dịch</span>
      </div>
      ${this.state.campaigns.map(c => `
        <div class="campaign-item ${this.state.currentCampaign === c._id ? 'active' : ''}" data-id="${c._id}">
          <span class="campaign-dot" style="background: ${c.color}"></span>
          <span>${c.name}</span>
        </div>
      `).join('')}
    `;

        // Thêm click handlers
        list.querySelectorAll('.campaign-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectCampaign(item.dataset.id || null);
            });
        });
    },

    // Chọn bộ lọc chiến dịch
    selectCampaign(campaignId) {
        this.state.currentCampaign = campaignId;
        this.renderCampaignList();

        // Cập nhật header badge
        const badge = document.getElementById('currentCampaignBadge');
        if (campaignId) {
            const campaign = this.state.campaigns.find(c => c._id === campaignId);
            badge.innerHTML = `
        <span class="campaign-dot" style="background: ${campaign.color}"></span>
        <span class="campaign-name">${campaign.name}</span>
      `;
        } else {
            badge.innerHTML = `
        <span class="campaign-dot" style="background: var(--text-muted)"></span>
        <span class="campaign-name">Tất Cả Chiến Dịch</span>
      `;
        }

        // Tải lại board
        Board.loadTasks();
    },

    // Điền select chiến dịch trong form task
    populateCampaignSelect() {
        UI.populateSelect('taskCampaign', this.state.campaigns, '_id', 'name', 'Chọn chiến dịch...');
    },

    // Điền select người dùng trong form task
    populateUserSelect() {
        UI.populateSelect('taskAssignee', this.state.users, '_id', 'name', 'Chưa phân công');
    },

    // Thiết lập navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.switchView(view);
            });
        });
    },

    // Chuyển view
    async switchView(view) {
        // Cập nhật nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Cập nhật tiêu đề trang
        const titles = {
            dashboard: 'Tổng Quan',
            board: 'Bảng Kanban',
            calendar: 'Lịch Nội Dung',
            campaigns: 'Chiến Dịch',
            team: 'Nhóm'
        };
        document.getElementById('pageTitle').textContent = titles[view] || 'Bảng Điều Khiển';

        // Ẩn tất cả views
        document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));

        // Hiển thị view được chọn
        const viewMap = {
            dashboard: 'dashboardView',
            board: 'boardView',
            calendar: 'calendarView',
            campaigns: 'campaignsView',
            team: 'teamView'
        };
        document.getElementById(viewMap[view]).classList.remove('hidden');

        // Tải dữ liệu view
        this.state.currentView = view;

        switch (view) {
            case 'dashboard':
                await Dashboard.load();
                break;
            case 'calendar':
                await Calendar.load();
                break;
            case 'campaigns':
                await this.renderCampaignsView();
                break;
            case 'team':
                await this.renderTeamView();
                break;
        }
    },

    // Render view chiến dịch
    async renderCampaignsView() {
        const grid = document.getElementById('campaignsGrid');

        if (this.state.campaigns.length === 0) {
            UI.showEmptyState('campaignsGrid', '🚀', 'Chưa có chiến dịch. Tạo chiến dịch đầu tiên!');
            return;
        }

        // Lấy chiến dịch với thống kê
        const campaignsWithStats = await Promise.all(
            this.state.campaigns.map(async c => {
                try {
                    return await API.campaigns.get(c._id);
                } catch {
                    return c;
                }
            })
        );

        grid.innerHTML = campaignsWithStats.map(c => `
      <div class="campaign-card" data-id="${c._id}">
        <div class="campaign-card-header">
          <span class="campaign-card-title">
            <span class="campaign-dot" style="background: ${c.color}"></span>
            ${c.name}
          </span>
          <span class="campaign-status ${c.status}">${UI.getStatusIcon(c.status)} ${UI.getStatusName(c.status)}</span>
        </div>
        <div class="campaign-dates">📅 ${UI.formatDate(c.startDate)} - ${UI.formatDate(c.endDate)}</div>
        <div class="campaign-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${c.progress || 0}%"></div>
          </div>
        </div>
        ${c.taskStats ? `
          <div class="campaign-stats">
            <div class="campaign-stat">
              <div class="stat-value">${c.taskStats.todo || 0}</div>
              <div class="stat-label">Cần Làm</div>
            </div>
            <div class="campaign-stat">
              <div class="stat-value">${c.taskStats['in-progress'] || 0}</div>
              <div class="stat-label">Đang Làm</div>
            </div>
            <div class="campaign-stat">
              <div class="stat-value">${c.taskStats.done || 0}</div>
              <div class="stat-label">Hoàn Thành</div>
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');

        // Thêm click handlers
        grid.querySelectorAll('.campaign-card').forEach(card => {
            card.addEventListener('click', () => {
                const campaignId = card.dataset.id;
                const campaign = this.state.campaigns.find(c => c._id === campaignId);
                if (campaign) this.openCampaignModal(campaign);
            });
        });
    },

    // Render view nhóm
    async renderTeamView() {
        const grid = document.getElementById('teamGrid');

        if (this.state.users.length === 0) {
            // Tạo người dùng mẫu
            await this.createSampleUsers();
        }

        // Lấy task counts cho mỗi user
        const allTasks = await API.tasks.getAll();
        const userTaskCounts = {};

        this.state.users.forEach(user => {
            const userTasks = allTasks.filter(t =>
                t.assignee?._id === user._id || t.assignee === user._id
            );
            userTaskCounts[user._id] = {
                total: userTasks.length,
                todo: userTasks.filter(t => t.status === 'todo').length,
                inProgress: userTasks.filter(t => t.status === 'in-progress').length,
                review: userTasks.filter(t => t.status === 'review').length,
                done: userTasks.filter(t => t.status === 'done').length,
                overdue: userTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
            };
        });

        const roleNames = {
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            member: 'Thành viên'
        };

        const roleColors = {
            admin: '#ef4444',
            manager: '#f59e0b',
            member: '#3b82f6'
        };

        grid.innerHTML = this.state.users.map(u => {
            const stats = userTaskCounts[u._id] || { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 };
            const workloadLevel = stats.total > 8 ? 'high' : stats.total > 4 ? 'medium' : 'low';

            return `
                <div class="team-card" data-id="${u._id}">
                    <div class="team-card-header">
                        <div class="team-avatar-lg">${u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                        <div class="team-info">
                            <div class="team-name">${u.name}</div>
                            <div class="team-role" style="color: ${roleColors[u.role] || '#6366f1'}">${roleNames[u.role] || u.role}</div>
                        </div>
                    </div>
                    
                    <div class="team-workload">
                        <div class="workload-header">
                            <span>Khối lượng công việc</span>
                            <span class="workload-level ${workloadLevel}">${stats.total} việc</span>
                        </div>
                        <div class="workload-bar-lg">
                            <div class="workload-fill-lg ${workloadLevel}" style="width: ${Math.min(stats.total * 10, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="team-stats-grid">
                        <div class="team-stat">
                            <span class="stat-icon">📥</span>
                            <span class="stat-value">${stats.todo}</span>
                            <span class="stat-name">Cần làm</span>
                        </div>
                        <div class="team-stat">
                            <span class="stat-icon">⚡</span>
                            <span class="stat-value">${stats.inProgress}</span>
                            <span class="stat-name">Đang làm</span>
                        </div>
                        <div class="team-stat">
                            <span class="stat-icon">✅</span>
                            <span class="stat-value">${stats.done}</span>
                            <span class="stat-name">Hoàn thành</span>
                        </div>
                        ${stats.overdue > 0 ? `
                            <div class="team-stat overdue">
                                <span class="stat-icon">🚨</span>
                                <span class="stat-value">${stats.overdue}</span>
                                <span class="stat-name">Quá hạn</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <button class="team-view-tasks-btn" onclick="App.filterByUser('${u._id}', '${u.name}')">
                        Xem công việc →
                    </button>
                </div>
            `;
        }).join('');
    },

    // Filter board by user
    async filterByUser(userId, userName) {
        this.selectCampaign(null); // Clear campaign filter
        await this.switchView('board');

        // Set filter and reload
        const tasks = await API.tasks.getAll({ assignee: userId });
        Board.tasks = tasks;
        Board.filterTasks();
        Board.render();

        UI.toast(`Đang hiển thị công việc của ${userName}`, 'info');
    },

    // Thiết lập modal chiến dịch
    setupCampaignModal() {
        document.getElementById('addCampaignBtn').addEventListener('click', () => {
            this.openCampaignModal();
        });

        document.getElementById('campaignForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCampaign();
        });

        document.getElementById('closeCampaignModal').addEventListener('click', () => {
            UI.hideModal('campaignModal');
        });

        document.getElementById('cancelCampaignBtn').addEventListener('click', () => {
            UI.hideModal('campaignModal');
        });

        document.querySelector('#campaignModal .modal-backdrop').addEventListener('click', () => {
            UI.hideModal('campaignModal');
        });

        document.getElementById('deleteCampaignBtn').addEventListener('click', async () => {
            const campaignId = document.getElementById('campaignId').value;
            if (campaignId && confirm('Xóa chiến dịch này và tất cả công việc của nó?')) {
                try {
                    await API.campaigns.delete(campaignId);
                    UI.hideModal('campaignModal');
                    await this.loadCampaigns();
                    await Board.loadTasks();
                    UI.toast('Đã xóa chiến dịch', 'success');
                } catch (error) {
                    UI.toast('Không thể xóa chiến dịch', 'error');
                }
            }
        });
    },

    // Mở modal chiến dịch
    openCampaignModal(campaign = null) {
        const isEdit = !!campaign;
        document.getElementById('campaignModalTitle').textContent = isEdit ? 'Chỉnh Sửa Chiến Dịch' : 'Tạo Chiến Dịch Mới';
        document.getElementById('deleteCampaignBtn').style.display = isEdit ? 'block' : 'none';

        document.getElementById('campaignForm').reset();
        document.getElementById('campaignId').value = campaign?._id || '';

        if (campaign) {
            document.getElementById('campaignName').value = campaign.name || '';
            document.getElementById('campaignDescription').value = campaign.description || '';
            document.getElementById('campaignStartDate').value = UI.formatDateInput(campaign.startDate);
            document.getElementById('campaignEndDate').value = UI.formatDateInput(campaign.endDate);
            document.getElementById('campaignBudget').value = campaign.budget || '';
            document.getElementById('campaignColor').value = campaign.color || '#6366f1';
            document.getElementById('campaignStatus').value = campaign.status || 'planning';
        } else {
            // Đặt ngày mặc định
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            document.getElementById('campaignStartDate').value = UI.formatDateInput(today);
            document.getElementById('campaignEndDate').value = UI.formatDateInput(nextMonth);
        }

        UI.showModal('campaignModal');
    },

    // Lưu chiến dịch
    async saveCampaign() {
        const campaignId = document.getElementById('campaignId').value;
        const submitBtn = document.querySelector('#campaignForm button[type="submit"]');

        // Get values
        const startDate = document.getElementById('campaignStartDate').value;
        const endDate = document.getElementById('campaignEndDate').value;
        const budgetInput = document.getElementById('campaignBudget').value;

        // Validation
        if (new Date(startDate) > new Date(endDate)) {
            UI.toast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
            return;
        }

        const data = {
            name: document.getElementById('campaignName').value,
            description: document.getElementById('campaignDescription').value,
            startDate,
            endDate,
            budget: budgetInput ? parseInt(budgetInput) : 0,
            color: document.getElementById('campaignColor').value,
            status: document.getElementById('campaignStatus').value
        };

        try {
            // Show loading
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang lưu...';
            submitBtn.disabled = true;

            if (campaignId) {
                await API.campaigns.update(campaignId, data);
                UI.toast('Đã cập nhật chiến dịch', 'success');
            } else {
                await API.campaigns.create(data);
                UI.toast('Đã tạo chiến dịch mới', 'success');
            }

            UI.hideModal('campaignModal');
            await this.loadCampaigns();

            if (this.state.currentView === 'campaigns') {
                await this.renderCampaignsView();
            }
        } catch (error) {
            console.error('Save campaign error:', error);
            UI.toast(error.message || 'Không thể lưu chiến dịch', 'error');
        } finally {
            // Reset loading
            if (submitBtn) {
                submitBtn.textContent = 'Lưu';
                submitBtn.disabled = false;
            }
        }
    },

    // Tạo dữ liệu mẫu
    async createSampleData() {
        console.log('Đang tạo dữ liệu mẫu...');

        // Tạo người dùng mẫu
        const users = await this.createSampleUsers();

        // Tạo chiến dịch mẫu
        const campaign = await API.campaigns.create({
            name: 'Chiến Dịch Ra Mắt Q1 2026',
            description: 'Chiến dịch ra mắt sản phẩm mới quý 1',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            color: '#6366f1',
            budget: 50000000
        });

        // Tạo công việc mẫu
        const sampleTasks = [
            { title: 'Viết content landing page', status: 'done', labels: ['content'], priority: 'high' },
            { title: 'Thiết kế banner quảng cáo', status: 'in-progress', labels: ['design', 'ads'], priority: 'high' },
            { title: 'Setup Facebook Ads', status: 'todo', labels: ['ads', 'social'], priority: 'medium' },
            { title: 'SEO on-page cho website', status: 'review', labels: ['seo'], priority: 'medium' },
            { title: 'Quay video giới thiệu sản phẩm', status: 'todo', labels: ['video'], priority: 'urgent' },
            { title: 'Chiến dịch Email Marketing', status: 'todo', labels: ['email'], priority: 'low' }
        ];

        for (const task of sampleTasks) {
            await API.tasks.create({
                ...task,
                campaign: campaign._id,
                assignee: users[Math.floor(Math.random() * users.length)]._id,
                dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
                scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        // Tải lại dữ liệu
        await this.loadCampaigns();
        await Board.loadTasks();

        UI.toast('Đã tạo dữ liệu mẫu!', 'success');
    },

    // Tạo người dùng mẫu
    async createSampleUsers() {
        if (this.state.users.length > 0) return this.state.users;

        const sampleUsers = [
            { name: 'Minh Anh', email: 'minhanh@company.com', role: 'manager' },
            { name: 'Hoàng Long', email: 'hoanglong@company.com', role: 'member' },
            { name: 'Thu Hà', email: 'thuha@company.com', role: 'member' },
            { name: 'Đức Anh', email: 'ducanh@company.com', role: 'member' }
        ];

        for (const user of sampleUsers) {
            await API.users.create(user);
        }

        await this.loadUsers();
        return this.state.users;
    }
};

// Khởi động app khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => App.init());
