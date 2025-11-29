// 自定义金色风格模态框
(function() {
    // 创建模态框HTML
    const modalHTML = `
        <div class="custom-modal-overlay" id="customModal">
            <div class="custom-modal">
                <div class="custom-modal-header">
                    <h3 class="custom-modal-title" id="customModalTitle">提示</h3>
                </div>
                <div class="custom-modal-body">
                    <p class="custom-modal-message" id="customModalMessage"></p>
                    <input type="text" class="custom-modal-input" id="customModalInput" style="display:none">
                </div>
                <div class="custom-modal-footer">
                    <button class="custom-modal-btn custom-modal-btn-cancel" id="customModalCancel">取消</button>
                    <button class="custom-modal-btn custom-modal-btn-confirm" id="customModalConfirm">确定</button>
                </div>
            </div>
        </div>
    `;

    // 在DOM加载完成后添加模态框
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // 添加模态框到body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 获取元素
        const overlay = document.getElementById('customModal');
        const cancelBtn = document.getElementById('customModalCancel');
        const confirmBtn = document.getElementById('customModalConfirm');

        // 点击遮罩层关闭
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // 取消按钮
        cancelBtn.addEventListener('click', closeModal);
    }

    function closeModal() {
        const overlay = document.getElementById('customModal');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // 自定义alert
    window.customAlert = function(message, title = '提示') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('customModal');
            const titleEl = document.getElementById('customModalTitle');
            const messageEl = document.getElementById('customModalMessage');
            const inputEl = document.getElementById('customModalInput');
            const cancelBtn = document.getElementById('customModalCancel');
            const confirmBtn = document.getElementById('customModalConfirm');

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.style.display = 'none';
            cancelBtn.style.display = 'none';
            confirmBtn.textContent = '确定';

            confirmBtn.onclick = function() {
                closeModal();
                resolve(true);
            };

            overlay.classList.add('active');
        });
    };

    // 自定义confirm
    window.customConfirm = function(message, title = '确认') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('customModal');
            const titleEl = document.getElementById('customModalTitle');
            const messageEl = document.getElementById('customModalMessage');
            const inputEl = document.getElementById('customModalInput');
            const cancelBtn = document.getElementById('customModalCancel');
            const confirmBtn = document.getElementById('customModalConfirm');

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.style.display = 'none';
            cancelBtn.style.display = 'inline-block';
            confirmBtn.textContent = '确定';

            cancelBtn.onclick = function() {
                closeModal();
                resolve(false);
            };

            confirmBtn.onclick = function() {
                closeModal();
                resolve(true);
            };

            overlay.classList.add('active');
        });
    };

    // 自定义prompt
    window.customPrompt = function(message, defaultValue = '', title = '输入') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('customModal');
            const titleEl = document.getElementById('customModalTitle');
            const messageEl = document.getElementById('customModalMessage');
            const inputEl = document.getElementById('customModalInput');
            const cancelBtn = document.getElementById('customModalCancel');
            const confirmBtn = document.getElementById('customModalConfirm');

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.style.display = 'block';
            inputEl.value = defaultValue;
            cancelBtn.style.display = 'inline-block';
            confirmBtn.textContent = '确定';

            // 聚焦输入框
            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 100);

            cancelBtn.onclick = function() {
                closeModal();
                resolve(null);
            };

            confirmBtn.onclick = function() {
                const value = inputEl.value.trim();
                closeModal();
                resolve(value || null);
            };

            // 回车确认
            inputEl.onkeydown = function(e) {
                if (e.key === 'Enter') {
                    confirmBtn.click();
                } else if (e.key === 'Escape') {
                    cancelBtn.click();
                }
            };

            overlay.classList.add('active');
        });
    };
})();
