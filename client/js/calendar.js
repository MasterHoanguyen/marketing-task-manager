/**
 * Calendar Module - Chức năng Lịch Nội Dung (Enhanced)
 */
const Calendar = {
    currentDate: new Date(),
    tasks: [],
    viewMode: 'month', // 'month' or 'week'
    draggedTask: null,

    // Khởi tạo calendar
    async init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    },

    // Tải dữ liệu calendar
    async load() {
        const month = this.currentDate.getMonth() + 1;
        const year = this.currentDate.getFullYear();

        try {
            this.tasks = await API.tasks.getCalendar(month, year);
            this.render();
        } catch (error) {
            // Fallback: tải tất cả tasks và lọc
            const allTasks = await API.tasks.getAll();
            this.tasks = allTasks.filter(t => t.scheduledDate);
            this.render();
        }
    },

    // Render calendar
    render() {
        this.updateTitle();
        if (this.viewMode === 'week') {
            this.renderWeekView();
        } else {
            this.renderGrid();
        }
    },

    // Cập nhật tiêu đề calendar
    updateTitle() {
        const months = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];

        let title;
        if (this.viewMode === 'week') {
            const weekStart = this.getWeekStart(this.currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            title = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`;
        } else {
            title = `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
        document.getElementById('calendarTitle').textContent = title;
    },

    // Get start of week (Monday)
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    // Render week view
    renderWeekView() {
        const grid = document.getElementById('calendarGrid');
        const weekStart = this.getWeekStart(this.currentDate);

        const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        let html = dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);

            const isToday = day.toDateString() === today.toDateString();
            const dateStr = day.toISOString().split('T')[0];
            const dayTasks = this.getTasksForDate(dateStr);

            html += `
                <div class="calendar-day week-view ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}"
                     ondragover="Calendar.onDragOver(event)"
                     ondrop="Calendar.onDrop(event, '${dateStr}')">
                    <div class="calendar-date">${day.getDate()}</div>
                    <div class="calendar-tasks">
                        ${dayTasks.map(t => this.createCalendarTask(t)).join('')}
                    </div>
                    <button class="quick-add-btn" onclick="Calendar.quickAdd('${dateStr}')">+ Thêm</button>
                </div>
            `;
        }

        grid.innerHTML = html;
        grid.classList.add('week-mode');
        this.attachTaskClickHandlers();
    },

    // Render lưới calendar
    renderGrid() {
        const grid = document.getElementById('calendarGrid');
        grid.classList.remove('week-mode');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Lấy ngày đầu tháng và tổng số ngày
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Tiêu đề các ngày trong tuần
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        let html = dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

        // Ngày tháng trước
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month"><div class="calendar-date">${day}</div></div>`;
        }

        // Ngày tháng hiện tại
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = this.getTasksForDate(dateStr);
            const hasMore = dayTasks.length > 3;
            const displayTasks = dayTasks.slice(0, 3);

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}"
                     ondragover="Calendar.onDragOver(event)"
                     ondrop="Calendar.onDrop(event, '${dateStr}')">
                    <div class="calendar-date">${day}</div>
                    <div class="calendar-tasks">
                        ${displayTasks.map(t => this.createCalendarTask(t)).join('')}
                        ${hasMore ? `<div class="calendar-more">+${dayTasks.length - 3} thêm</div>` : ''}
                    </div>
                </div>
            `;
        }

        // Ngày tháng sau
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const nextMonthDays = totalCells - firstDay - daysInMonth;
        for (let day = 1; day <= nextMonthDays; day++) {
            html += `<div class="calendar-day other-month"><div class="calendar-date">${day}</div></div>`;
        }

        grid.innerHTML = html;
        this.attachTaskClickHandlers();
    },

    // Attach click handlers to calendar tasks
    attachTaskClickHandlers() {
        document.querySelectorAll('.calendar-task').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = el.dataset.id;
                const task = this.tasks.find(t => t._id === taskId);
                if (task) Board.openTaskModal(task);
            });
        });

        // Click vào ngày để thêm task
        document.querySelectorAll('.calendar-day:not(.other-month)').forEach(el => {
            el.addEventListener('dblclick', () => {
                const date = el.dataset.date;
                if (date) this.quickAdd(date);
            });
        });
    },

    // Lấy tasks cho ngày cụ thể
    getTasksForDate(dateStr) {
        return this.tasks.filter(task => {
            if (!task.scheduledDate) return false;
            const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
            return taskDate === dateStr;
        });
    },

    // Tạo element task trong calendar
    createCalendarTask(task) {
        const color = task.campaign?.color || this.getPriorityColor(task.priority);
        const priorityIcon = UI.getPriorityIcon(task.priority);
        return `
            <div class="calendar-task" 
                 data-id="${task._id}" 
                 draggable="true"
                 ondragstart="Calendar.onDragStart(event, '${task._id}')"
                 style="background: ${color}20; color: ${color}; border-left: 3px solid ${color}">
                <span class="calendar-task-priority">${priorityIcon}</span>
                <span class="calendar-task-title">${task.title}</span>
            </div>
        `;
    },

    // Get priority color
    getPriorityColor(priority) {
        const colors = {
            urgent: '#ef4444',
            high: '#f97316',
            medium: '#eab308',
            low: '#22c55e'
        };
        return colors[priority] || '#6366f1';
    },

    // Quick add task
    quickAdd(dateStr) {
        // Mở modal task với ngày đã chọn
        Board.openTaskModal();
        // Đặt scheduled date
        setTimeout(() => {
            document.getElementById('taskScheduledDate').value = dateStr;
        }, 100);
    },

    // Drag and drop handlers
    onDragStart(event, taskId) {
        this.draggedTask = taskId;
        event.dataTransfer.setData('text/plain', taskId);
        event.target.classList.add('dragging');
    },

    onDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    },

    onDrop(event, dateStr) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');

        if (this.draggedTask) {
            this.updateTaskDate(this.draggedTask, dateStr);
            this.draggedTask = null;
        }
    },

    async updateTaskDate(taskId, dateStr) {
        try {
            await API.tasks.update(taskId, { scheduledDate: dateStr });
            UI.toast('Đã cập nhật ngày lên lịch', 'success');
            await this.load();
        } catch (error) {
            UI.toast('Không thể cập nhật ngày', 'error');
        }
    },

    // Setup drag and drop
    setupDragAndDrop() {
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('calendar-task')) {
                e.target.classList.remove('dragging');
            }
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });
    },

    // Thiết lập event listeners
    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() - 7);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            }
            this.load();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            if (this.viewMode === 'week') {
                this.currentDate.setDate(this.currentDate.getDate() + 7);
            } else {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            }
            this.load();
        });
    },

    // Toggle view mode
    toggleViewMode() {
        this.viewMode = this.viewMode === 'month' ? 'week' : 'month';
        this.render();
    }
};

