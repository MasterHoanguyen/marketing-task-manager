/**
 * UI Module - Xử lý tiện ích UI và các hàm chung
 */
const UI = {
    // Hiển thị thông báo toast
    toast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
      <span>${icons[type] || '📌'}</span>
      <span>${message}</span>
    `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Hiển thị/ẩn modal
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    // Định dạng ngày tháng
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    // Định dạng ngày cho input
    formatDateInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    },

    // Lấy icon độ ưu tiên
    getPriorityIcon(priority) {
        const icons = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            urgent: '🔴'
        };
        return icons[priority] || '🟡';
    },

    // Lấy icon trạng thái
    getStatusIcon(status) {
        const icons = {
            planning: '📋',
            active: '🚀',
            paused: '⏸️',
            completed: '✅'
        };
        return icons[status] || '📋';
    },

    // Lấy tên trạng thái tiếng Việt
    getStatusName(status) {
        const names = {
            planning: 'Lên kế hoạch',
            active: 'Đang chạy',
            paused: 'Tạm dừng',
            completed: 'Hoàn thành'
        };
        return names[status] || status;
    },

    // Lấy icon nhãn
    getLabelIcon(label) {
        const icons = {
            content: '📝',
            seo: '🔍',
            ads: '📢',
            social: '📱',
            email: '✉️',
            event: '🎉',
            design: '🎨',
            video: '🎬'
        };
        return icons[label] || '🏷️';
    },

    // Lấy tên nhãn tiếng Việt
    getLabelName(label) {
        const names = {
            content: 'Nội dung',
            seo: 'SEO',
            ads: 'Quảng cáo',
            social: 'MXH',
            email: 'Email',
            event: 'Sự kiện',
            design: 'Thiết kế',
            video: 'Video'
        };
        return names[label] || label;
    },

    // Kiểm tra quá hạn
    isOverdue(dateString) {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    },

    // Tạo avatar
    createAvatar(user, size = 'small') {
        const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
        const sizeClass = size === 'small' ? 'style="width:24px;height:24px;font-size:10px"' : '';
        return `<div class="avatar" ${sizeClass}>${initial}</div>`;
    },

    // Điền select với options
    populateSelect(selectId, items, valueKey = '_id', textKey = 'name', placeholder = 'Chọn...') {
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">${placeholder}</option>`;
        items.forEach(item => {
            select.innerHTML += `<option value="${item[valueKey]}">${item[textKey]}</option>`;
        });
    },

    // Hiển thị loading
    setLoading(elementId, loading) {
        const element = document.getElementById(elementId);
        if (loading) {
            element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        }
    },

    // Hiển thị empty state
    showEmptyState(elementId, icon, message) {
        const element = document.getElementById(elementId);
        element.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-text">${message}</div>
      </div>
    `;
    },

    // Hiển thị loading skeleton
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        element.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-row">
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                    <div class="skeleton skeleton-card"></div>
                </div>
                <div class="skeleton-row">
                    <div class="skeleton skeleton-box"></div>
                    <div class="skeleton skeleton-box"></div>
                </div>
            </div>
        `;
    },

    // Format time ago (thời gian trước)
    formatTimeAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return this.formatDate(dateString);
    },

    // Get task status icon
    getTaskStatusIcon(status) {
        const icons = {
            'todo': '📥',
            'in-progress': '⚡',
            'review': '👀',
            'done': '✅'
        };
        return icons[status] || '📋';
    },

    // Inject checklist HTML into task modal
    injectChecklistHTML() {
        const labelsDiv = document.querySelector('#taskLabels')?.parentElement;
        if (!labelsDiv || document.getElementById('checklistContainer')) return;

        const checklistHTML = `
            <div class="form-group">
                <label>📋 Checklist</label>
                <div class="checklist-container" id="checklistContainer"></div>
                <div class="checklist-add">
                    <input type="text" id="newChecklistItem" placeholder="Thêm hạng mục mới...">
                    <button type="button" class="btn btn-secondary" id="addChecklistBtn">+</button>
                </div>
                <div class="checklist-progress">
                    <div class="checklist-progress-bar">
                        <div class="checklist-progress-fill" id="checklistProgressFill"></div>
                    </div>
                    <span class="checklist-progress-text" id="checklistProgressText">0/0</span>
                </div>
            </div>
        `;

        labelsDiv.insertAdjacentHTML('afterend', checklistHTML);

        // Setup listeners
        const addBtn = document.getElementById('addChecklistBtn');
        const input = document.getElementById('newChecklistItem');

        if (addBtn) {
            addBtn.addEventListener('click', () => Board.addChecklistItem());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    Board.addChecklistItem();
                }
            });
        }
    }
};

// Inject checklist HTML when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => UI.injectChecklistHTML(), 500);
});

