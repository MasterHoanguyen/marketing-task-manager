/**
 * Board Module - Xử lý chức năng Kanban board
 */
const Board = {
    tasks: [],
    filteredTasks: [],
    draggedTask: null,

    // Khởi tạo board
    async init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        await this.loadTasks();
    },

    // Tải tasks từ API
    async loadTasks(filters = {}) {
        try {
            // Thêm filter campaign nếu đang chọn
            if (App.state.currentCampaign) {
                filters.campaign = App.state.currentCampaign;
            }

            this.tasks = await API.tasks.getAll(filters);
            this.filterTasks();
            this.render();
        } catch (error) {
            UI.toast('Không thể tải công việc', 'error');
        }
    },

    // Lọc tasks theo tìm kiếm và bộ lọc
    filterTasks() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('filterStatus').value;
        const labelFilter = document.getElementById('filterLabel').value;

        this.filteredTasks = this.tasks.filter(task => {
            // Lọc tìm kiếm
            if (searchQuery && !task.title.toLowerCase().includes(searchQuery)) {
                return false;
            }
            // Lọc trạng thái
            if (statusFilter && task.status !== statusFilter) {
                return false;
            }
            // Lọc nhãn
            if (labelFilter && !task.labels?.includes(labelFilter)) {
                return false;
            }
            return true;
        });
    },

    // Render board
    render() {
        const statuses = ['todo', 'in-progress', 'review', 'done'];

        statuses.forEach(status => {
            const column = document.querySelector(`.column-tasks[data-status="${status}"]`);
            const tasks = this.filteredTasks.filter(t => t.status === status);
            const count = document.querySelector(`.column-count[data-count="${status}"]`);

            count.textContent = tasks.length;

            if (tasks.length === 0) {
                column.innerHTML = '<div class="empty-state"><div class="empty-text">Không có công việc</div></div>';
                return;
            }

            column.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');
        });

        // Thêm click handlers cho task cards
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                const taskId = card.dataset.id;
                const task = this.tasks.find(t => t._id === taskId);
                if (task) this.openTaskModal(task);
            });
        });
    },

    // Tạo HTML cho task card
    createTaskCard(task) {
        const isOverdue = task.dueDate && UI.isOverdue(task.dueDate) && task.status !== 'done';
        const labels = task.labels?.map(l =>
            `<span class="label-tag ${l}">${UI.getLabelIcon(l)}</span>`
        ).join('') || '';

        const assignee = task.assignee ?
            `<div class="task-assignee">${UI.createAvatar(task.assignee)}</div>` : '';

        const dueDate = task.dueDate ?
            `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${UI.formatDate(task.dueDate)}</span>` : '';

        const campaignBadge = task.campaign ?
            `<span class="task-campaign-badge" style="border-left: 3px solid ${task.campaign.color || '#6366f1'}">${task.campaign.name}</span>` : '';

        return `
      <div class="task-card ${isOverdue ? 'overdue' : ''}" 
           draggable="true" 
           data-id="${task._id}">
        <div class="task-header">
          <span class="task-title">${task.title}</span>
          <span class="task-priority">${UI.getPriorityIcon(task.priority)}</span>
        </div>
        ${labels ? `<div class="task-labels">${labels}</div>` : ''}
        ${campaignBadge}
        <div class="task-meta">
          ${assignee}
          ${dueDate}
        </div>
      </div>
    `;
    },

    // Thiết lập drag and drop
    setupDragAndDrop() {
        document.querySelectorAll('.column-tasks').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');

                if (!this.draggedTask) return;

                const newStatus = column.dataset.status;
                const taskId = this.draggedTask.dataset.id;

                try {
                    await API.tasks.updateStatus(taskId, newStatus, 0);
                    await this.loadTasks();
                    UI.toast('Đã chuyển công việc', 'success');
                } catch (error) {
                    UI.toast('Không thể chuyển công việc', 'error');
                }
            });
        });

        // Sử dụng event delegation cho drag events
        document.querySelector('.kanban-board').addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                this.draggedTask = e.target;
                e.target.classList.add('dragging');
            }
        });

        document.querySelector('.kanban-board').addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
                this.draggedTask = null;
            }
        });
    },

    // Thiết lập event listeners
    setupEventListeners() {
        // Tìm kiếm
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterTasks();
            this.render();
        });

        // Bộ lọc
        document.getElementById('filterStatus').addEventListener('change', () => {
            this.filterTasks();
            this.render();
        });

        document.getElementById('filterLabel').addEventListener('change', () => {
            this.filterTasks();
            this.render();
        });

        // Nút thêm task
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // Form task
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveTask();
        });

        // Nút đóng modal
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            UI.hideModal('taskModal');
        });

        document.getElementById('cancelTaskBtn').addEventListener('click', () => {
            UI.hideModal('taskModal');
        });

        document.querySelector('#taskModal .modal-backdrop').addEventListener('click', () => {
            UI.hideModal('taskModal');
        });

        // Xóa task
        document.getElementById('deleteTaskBtn').addEventListener('click', async () => {
            const taskId = document.getElementById('taskId').value;
            if (taskId && confirm('Bạn có chắc muốn xóa công việc này?')) {
                try {
                    await API.tasks.delete(taskId);
                    UI.hideModal('taskModal');
                    await this.loadTasks();
                    UI.toast('Đã xóa công việc', 'success');
                } catch (error) {
                    UI.toast('Không thể xóa công việc', 'error');
                }
            }
        });
    },

    // Mở modal task
    openTaskModal(task = null) {
        const isEdit = !!task;
        document.getElementById('taskModalTitle').textContent = isEdit ? 'Chỉnh Sửa Công Việc' : 'Tạo Công Việc Mới';
        document.getElementById('deleteTaskBtn').style.display = isEdit ? 'block' : 'none';

        // Reset form
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = task?._id || '';

        // Reset checklist
        this.currentChecklist = task?.checklist || [];
        this.renderChecklist();

        if (task) {
            document.getElementById('taskTitle').value = task.title || '';
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskCampaign').value = task.campaign?._id || task.campaign || '';
            document.getElementById('taskAssignee').value = task.assignee?._id || task.assignee || '';
            document.getElementById('taskDueDate').value = UI.formatDateInput(task.dueDate);
            document.getElementById('taskScheduledDate').value = UI.formatDateInput(task.scheduledDate);
            document.getElementById('taskPriority').value = task.priority || 'medium';
            document.getElementById('taskStatus').value = task.status || 'todo';

            // Đặt nhãn
            document.querySelectorAll('#taskLabels input').forEach(input => {
                input.checked = task.labels?.includes(input.value) || false;
            });
        } else {
            // Đặt campaign mặc định nếu đang chọn
            if (App.state.currentCampaign) {
                document.getElementById('taskCampaign').value = App.state.currentCampaign;
            }
        }

        UI.showModal('taskModal');
    },

    // Checklist state
    currentChecklist: [],

    // Render checklist
    renderChecklist() {
        const container = document.getElementById('checklistContainer');
        if (!container) return;

        if (this.currentChecklist.length === 0) {
            container.innerHTML = '<div class="checklist-empty">Chưa có hạng mục nào</div>';
        } else {
            container.innerHTML = this.currentChecklist.map((item, index) => `
                <div class="checklist-item ${item.completed ? 'completed' : ''}">
                    <input type="checkbox" ${item.completed ? 'checked' : ''} 
                           onchange="Board.toggleChecklistItem(${index})">
                    <span class="checklist-text">${item.text}</span>
                    <button type="button" class="checklist-delete" onclick="Board.removeChecklistItem(${index})">×</button>
                </div>
            `).join('');
        }

        this.updateChecklistProgress();
    },

    // Add checklist item
    addChecklistItem() {
        const input = document.getElementById('newChecklistItem');
        const text = input.value.trim();
        if (text) {
            this.currentChecklist.push({ text, completed: false });
            input.value = '';
            this.renderChecklist();
        }
    },

    // Toggle checklist item
    toggleChecklistItem(index) {
        if (this.currentChecklist[index]) {
            this.currentChecklist[index].completed = !this.currentChecklist[index].completed;
            this.renderChecklist();
        }
    },

    // Remove checklist item
    removeChecklistItem(index) {
        this.currentChecklist.splice(index, 1);
        this.renderChecklist();
    },

    // Update checklist progress
    updateChecklistProgress() {
        const progressFill = document.getElementById('checklistProgressFill');
        const progressText = document.getElementById('checklistProgressText');

        if (!progressFill || !progressText) return;

        const total = this.currentChecklist.length;
        const completed = this.currentChecklist.filter(item => item.completed).length;
        const percent = total > 0 ? (completed / total) * 100 : 0;

        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${completed}/${total}`;
    },

    // Lưu task
    async saveTask() {
        const taskId = document.getElementById('taskId').value;
        const submitBtn = document.querySelector('#taskForm button[type="submit"]');

        const labels = Array.from(document.querySelectorAll('#taskLabels input:checked'))
            .map(input => input.value);

        const data = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            campaign: document.getElementById('taskCampaign').value,
            assignee: document.getElementById('taskAssignee').value || null,
            dueDate: document.getElementById('taskDueDate').value || null,
            scheduledDate: document.getElementById('taskScheduledDate').value || null,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            labels,
            checklist: this.currentChecklist
        };

        try {
            // Show loading
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang lưu...';
            submitBtn.disabled = true;

            if (taskId) {
                await API.tasks.update(taskId, data);
                UI.toast('Đã cập nhật công việc', 'success');
            } else {
                await API.tasks.create(data);
                UI.toast('Đã tạo công việc mới', 'success');
            }

            UI.hideModal('taskModal');
            await this.loadTasks();
        } catch (error) {
            console.error('Save task error:', error);
            UI.toast(error.message || 'Không thể lưu công việc', 'error');
        } finally {
            // Reset loading
            if (submitBtn) {
                submitBtn.textContent = 'Lưu';
                submitBtn.disabled = false;
            }
        }
    },

    // Setup checklist event listeners
    setupChecklistListeners() {
        const addBtn = document.getElementById('addChecklistBtn');
        const input = document.getElementById('newChecklistItem');

        if (addBtn) {
            addBtn.addEventListener('click', () => this.addChecklistItem());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addChecklistItem();
                }
            });
        }
    }
};

// Setup checklist listeners after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => Board.setupChecklistListeners(), 100);
});

