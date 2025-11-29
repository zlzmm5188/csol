/**
 * iOS风格弹窗组件 - 全局统一
 * 使用方法：
 *   showToast('标题', '消息') - 仅提示
 *   showConfirm('标题', '消息') - 确认对话框，返回Promise<boolean>
 */

// iOS原生风格弹窗 - 仅提示
async function showToast(title, message) {
    // 确保DOM已加载
    if (!document.getElementById('iosToastOverlay')) {
        initIOSToast();
    }

    const overlay = document.getElementById('iosToastOverlay');
    const toast = document.getElementById('iosToast');
    const titleEl = document.getElementById('iosToastTitle');
    const msgEl = document.getElementById('iosToastMessage');
    const cancelBtn = document.getElementById('iosToastCancel');
    const confirmBtn = document.getElementById('iosToastConfirm');

    if (!overlay || !toast || !titleEl || !msgEl || !confirmBtn) {
        console.error('iOS弹窗元素未找到，使用fallback');
        alert(title + ': ' + message);
        return Promise.resolve(true);
    }

    // 如果标题为空，隐藏标题只显示消息
    if (title) {
        titleEl.textContent = title;
        titleEl.style.display = 'block';
    } else {
        titleEl.style.display = 'none';
    }

    msgEl.textContent = message || '';
    msgEl.style.whiteSpace = 'pre-line';
    msgEl.style.padding = title ? '0 16px 16px' : '20px 16px';

    // 只显示一个确定按钮，隐藏取消按钮
    cancelBtn.style.display = 'none';
    confirmBtn.textContent = '确定';
    confirmBtn.classList.add('only-button');
    overlay.classList.add('show');
    toast.classList.add('show');

    return new Promise((resolve) => {
        let isResolved = false;
        const closeToast = (e) => {
            if (isResolved) return;
            isResolved = true;
            e && e.stopPropagation();
            toast.classList.remove('show');
            overlay.classList.remove('show');
            confirmBtn.classList.remove('only-button');
            cancelBtn.style.display = 'none';
            resolve(true);
        };

        // 立即绑定确定按钮点击事件（移除100ms延迟）
        confirmBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeToast(e);
        };

        // 点击遮罩也关闭
        overlay.onclick = (e) => {
            if(e.target === overlay){
                closeToast(e);
            }
        };
    });
}

// iOS原生风格弹窗 - 确认对话框
async function showConfirm(title, message) {
    // 确保DOM已加载
    if (!document.getElementById('iosToastOverlay')) {
        initIOSToast();
    }

    const overlay = document.getElementById('iosToastOverlay');
    const toast = document.getElementById('iosToast');
    const titleEl = document.getElementById('iosToastTitle');
    const msgEl = document.getElementById('iosToastMessage');
    const cancelBtn = document.getElementById('iosToastCancel');
    const confirmBtn = document.getElementById('iosToastConfirm');

    if (!overlay || !toast || !titleEl || !msgEl || !confirmBtn || !cancelBtn) {
        console.error('iOS弹窗元素未找到，使用fallback');
        return Promise.resolve(confirm(title + ': ' + message));
    }

    titleEl.textContent = title || '确认';
    msgEl.textContent = message || '';
    msgEl.style.whiteSpace = 'pre-line';

    // 显示两个按钮
    cancelBtn.style.display = 'flex';
    confirmBtn.textContent = '确定';
    confirmBtn.classList.remove('only-button');
    overlay.classList.add('show');
    toast.classList.add('show');

    return new Promise((resolve) => {
        let isResolved = false;

        const closeToast = (result) => {
            if (isResolved) return;
            isResolved = true;
            toast.classList.remove('show');
            overlay.classList.remove('show');
            cancelBtn.style.display = 'none';
            resolve(result);
        };

        // 清除旧的事件监听器并绑定新的
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const newConfirmBtnEl = document.getElementById('iosToastConfirm');
        const newCancelBtnEl = document.getElementById('iosToastCancel');

        newConfirmBtnEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeToast(true);
        });

        newCancelBtnEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeToast(false);
        });
    });
}

// 初始化iOS弹窗DOM元素
function initIOSToast() {
    // 检查是否已存在
    if (document.getElementById('iosToastOverlay')) {
        return;
    }

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
/* 优化的弹窗样式 */
.ios-toast{
    position:fixed !important;
    top:50% !important;
    left:50% !important;
    transform:translate(-50%,-50%) scale(0.9) !important;
    background:linear-gradient(to bottom, #ffffff, #f8f9fa) !important;
    border-radius:16px !important;
    width:280px !important;
    max-width:90% !important;
    box-shadow:0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05) !important;
    z-index:999999 !important;
    opacity:0 !important;
    pointer-events:none !important;
    transition:all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    overflow:hidden !important;
    visibility:hidden !important;
}
.ios-toast.show{
    visibility:visible !important;
    transform:translate(-50%,-50%) scale(1) !important;
}
.ios-toast-overlay{
    position:fixed !important;
    top:0 !important;
    left:0 !important;
    right:0 !important;
    bottom:0 !important;
    background:rgba(0,0,0,0.45) !important;
    backdrop-filter:blur(4px) !important;
    -webkit-backdrop-filter:blur(4px) !important;
    z-index:999998 !important;
    opacity:0 !important;
    pointer-events:none !important;
    transition:opacity 0.3s !important;
    visibility:hidden !important;
}
.ios-toast-overlay.show{
    visibility:visible !important;
}
.ios-toast-overlay.show{
    opacity:1 !important;
    pointer-events:auto !important;
}
.ios-toast.show{
    opacity:1 !important;
    transform:translate(-50%,-50%) scale(1) !important;
    pointer-events:auto !important;
    display:block !important;
}
.ios-toast.show .ios-toast-buttons,
.ios-toast.show .ios-toast-button{
    pointer-events:auto;
}
.ios-toast-title{
    font-size:17px !important;
    font-weight:600 !important;
    color:#000 !important;
    text-align:center !important;
    padding:18px 20px 0 !important;
    line-height:1.4 !important;
    margin:0 !important;
}
.ios-toast-title:empty{
    display:none !important;
    padding:0 !important;
    margin:0 !important;
}
.ios-toast-message{
    font-size:16px !important;
    color:#1f2937 !important;
    text-align:center !important;
    line-height:1.6 !important;
    padding:18px 20px 20px !important;
    white-space:pre-line !important;
    word-break:break-word !important;
    min-height:auto !important;
    font-weight:500 !important;
}
.ios-toast-buttons{
    display:flex !important;
    border-top:1px solid #e5e7eb !important;
    background:#ffffff !important;
    border-radius:0 0 16px 16px !important;
    position:relative !important;
    overflow:hidden !important;
}
.ios-toast-button{
    flex:1 !important;
    display:flex !important;
    align-items:center !important;
    justify-content:center !important;
    padding:14px 16px !important;
    font-size:16px !important;
    color:#007AFF !important;
    background:transparent !important;
    border:none !important;
    cursor:pointer !important;
    transition:background 0.15s !important;
    position:relative !important;
    user-select:none !important;
    -webkit-user-select:none !important;
    -webkit-tap-highlight-color:transparent !important;
    font-weight:600 !important;
}
.ios-toast-button#iosToastCancel{
    display:none !important;
}
.ios-toast-button::after{
    content:'';
    position:absolute;
    right:0;
    top:0;
    bottom:0;
    width:0.5px;
    background:rgba(60,60,67,0.29);
}
.ios-toast-button:first-child{
    color:inherit;
}
.ios-toast-button:last-child::after{
    display:none;
}
.ios-toast-button.only-button::after{
    display:none;
}
.ios-toast-button:active{
    background:rgba(0,0,0,0.1);
    opacity:0.7;
}
.ios-toast-button#iosToastCancel{
    color:#000;
    font-weight:400;
}
.ios-toast-button#iosToastConfirm{
    color:#007AFF;
    font-weight:600;
}
    `;
    document.head.appendChild(style);

    // 创建HTML结构
    const overlay = document.createElement('div');
    overlay.className = 'ios-toast-overlay';
    overlay.id = 'iosToastOverlay';

    const toast = document.createElement('div');
    toast.className = 'ios-toast';
    toast.id = 'iosToast';
    toast.innerHTML = `
        <div class="ios-toast-title" id="iosToastTitle"></div>
        <div class="ios-toast-message" id="iosToastMessage"></div>
        <div class="ios-toast-buttons">
            <div class="ios-toast-button" id="iosToastCancel" style="display:none">取消</div>
            <div class="ios-toast-button" id="iosToastConfirm">确定</div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(toast);
}

// 页面加载时自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIOSToast);
} else {
    initIOSToast();
}

// 导出全局函数
window.showToast = showToast;
window.showConfirm = showConfirm;
