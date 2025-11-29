/**
 * iOS风格弹窗组件 - 全局统一
 * 使用方法：
 *   showToast('标题', '消息') - 仅提示
 *   showConfirm('标题', '消息') - 确认对话框，返回Promise<boolean>
 */

// iOS原生风格弹窗 - 仅提示（自动消失，无需点击确定）
async function showToast(title, message) {
    // ✅ 确保DOM已完全加载
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            } else {
                resolve();
            }
        });
    }

    // ✅ 确保body存在
    if (!document.body) {
        await new Promise(resolve => {
            const checkBody = setInterval(() => {
                if (document.body) {
                    clearInterval(checkBody);
                    resolve();
                }
            }, 10);
            setTimeout(() => {
                clearInterval(checkBody);
                resolve();
            }, 1000);
        });
    }

    // ✅ 初始化iOS弹窗（如果未初始化）
    if (!document.getElementById('iosToastOverlay')) {
        initIOSToast();
        // 等待DOM元素创建完成
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const overlay = document.getElementById('iosToastOverlay');
    const toast = document.getElementById('iosToast');
    const titleEl = document.getElementById('iosToastTitle');
    const msgEl = document.getElementById('iosToastMessage');
    const cancelBtn = document.getElementById('iosToastCancel');
    const confirmBtn = document.getElementById('iosToastConfirm');

    // ✅ 如果元素仍未找到，强制重新初始化并等待
    if (!overlay || !toast || !titleEl || !msgEl || !confirmBtn) {
        console.warn('iOS弹窗元素未找到，强制重新初始化...');
        // 清除可能存在的旧元素
        const oldOverlay = document.getElementById('iosToastOverlay');
        const oldToast = document.getElementById('iosToast');
        if (oldOverlay) oldOverlay.remove();
        if (oldToast) oldToast.remove();

        // 重新初始化
        initIOSToast();
        await new Promise(resolve => setTimeout(resolve, 100));

        // 再次获取元素
        const newOverlay = document.getElementById('iosToastOverlay');
        const newToast = document.getElementById('iosToast');
        const newTitleEl = document.getElementById('iosToastTitle');
        const newMsgEl = document.getElementById('iosToastMessage');
        const newConfirmBtn = document.getElementById('iosToastConfirm');

        if (!newOverlay || !newToast || !newTitleEl || !newMsgEl || !newConfirmBtn) {
            console.error('iOS弹窗初始化失败，但不会使用alert()，而是静默失败');
            return Promise.resolve(true);
        }

        // 使用新获取的元素
        const finalOverlay = newOverlay;
        const finalToast = newToast;
        const finalTitleEl = newTitleEl;
        const finalMsgEl = newMsgEl;
        const finalCancelBtn = document.getElementById('iosToastCancel');
        const finalConfirmBtn = newConfirmBtn;

        // 继续执行显示逻辑（使用final变量）
        return displayToast(finalOverlay, finalToast, finalTitleEl, finalMsgEl, finalCancelBtn, finalConfirmBtn, title, message);
    }

    // ✅ 正常显示iOS弹窗
    return displayToast(overlay, toast, titleEl, msgEl, cancelBtn, confirmBtn, title, message);
}

// ✅ 提取显示逻辑为独立函数
function displayToast(overlay, toast, titleEl, msgEl, cancelBtn, confirmBtn, title, message) {

    // ✅ 如果标题为空或包含域名，隐藏标题只显示消息
    if (title && !title.includes('4kp3l0iq') && !title.includes('http') && !title.includes('www.')) {
        titleEl.textContent = title;
        titleEl.style.display = 'block';
    } else {
        titleEl.style.display = 'none';
    }

    msgEl.textContent = message || '';
    msgEl.style.whiteSpace = 'pre-line';
    msgEl.style.padding = title ? '0 16px 16px' : '20px 16px';

    // 只显示一个确定按钮，隐藏取消按钮
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (confirmBtn) {
        confirmBtn.textContent = '确定';
        confirmBtn.classList.add('only-button');
    }
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
            if (confirmBtn) confirmBtn.classList.remove('only-button');
            if (cancelBtn) cancelBtn.style.display = 'none';
            resolve(true);
        };

        // 自动关闭：1.5秒后自动消失（无需用户点击）
        const autoTimer = setTimeout(() => {
            if (!isResolved) {
                closeToast();
            }
        }, 1500);

        // 移除点击确定按钮的事件监听，让弹窗完全自动消失
        if (confirmBtn) confirmBtn.onclick = null;

        // 点击遮罩也关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                clearTimeout(autoTimer);
                closeToast(e);
            }
        };
    });
}

// iOS原生风格弹窗 - 确认对话框
async function showConfirm(title, message) {
    // ✅ 确保DOM已完全加载
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            } else {
                resolve();
            }
        });
    }

    // ✅ 确保body存在
    if (!document.body) {
        await new Promise(resolve => {
            const checkBody = setInterval(() => {
                if (document.body) {
                    clearInterval(checkBody);
                    resolve();
                }
            }, 10);
            setTimeout(() => {
                clearInterval(checkBody);
                resolve();
            }, 1000);
        });
    }

    // ✅ 初始化iOS弹窗（如果未初始化）
    if (!document.getElementById('iosToastOverlay')) {
        initIOSToast();
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    const overlay = document.getElementById('iosToastOverlay');
    const toast = document.getElementById('iosToast');
    const titleEl = document.getElementById('iosToastTitle');
    const msgEl = document.getElementById('iosToastMessage');
    const cancelBtn = document.getElementById('iosToastCancel');
    const confirmBtn = document.getElementById('iosToastConfirm');

    // ✅ 如果元素仍未找到，强制重新初始化
    if (!overlay || !toast || !titleEl || !msgEl || !confirmBtn || !cancelBtn) {
        console.warn('iOS弹窗元素未找到，强制重新初始化...');
        const oldOverlay = document.getElementById('iosToastOverlay');
        const oldToast = document.getElementById('iosToast');
        if (oldOverlay) oldOverlay.remove();
        if (oldToast) oldToast.remove();

        initIOSToast();
        await new Promise(resolve => setTimeout(resolve, 100));

        const newOverlay = document.getElementById('iosToastOverlay');
        const newToast = document.getElementById('iosToast');
        const newTitleEl = document.getElementById('iosToastTitle');
        const newMsgEl = document.getElementById('iosToastMessage');
        const newCancelBtn = document.getElementById('iosToastCancel');
        const newConfirmBtn = document.getElementById('iosToastConfirm');

        if (!newOverlay || !newToast || !newTitleEl || !newMsgEl || !newConfirmBtn || !newCancelBtn) {
            console.error('iOS弹窗初始化失败，返回false');
            return Promise.resolve(false);
        }

        // 使用新获取的元素继续执行
        return displayConfirm(newOverlay, newToast, newTitleEl, newMsgEl, newCancelBtn, newConfirmBtn, title, message);
    }

    return displayConfirm(overlay, toast, titleEl, msgEl, cancelBtn, confirmBtn, title, message);
}

// ✅ 提取确认对话框显示逻辑为独立函数
function displayConfirm(overlay, toast, titleEl, msgEl, cancelBtn, confirmBtn, title, message) {

    // ✅ 过滤掉域名相关的标题
    const cleanTitle = (title && !title.includes('4kp3l0iq') && !title.includes('http') && !title.includes('www.')) ? title : '确认';
    titleEl.textContent = cleanTitle;
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

    // ✅ 确保body存在
    if (!document.body) {
        console.warn('initIOSToast: document.body 不存在，延迟初始化');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initIOSToast, { once: true });
        } else {
            setTimeout(initIOSToast, 100);
        }
        return;
    }

    // 创建样式 - 使用唯一ID防止冲突
    const styleId = 'ios-toast-styles';
    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
/* iOS风格弹窗样式 - 强制最高优先级 */
#iosToast,
.ios-toast{
    position:fixed !important;
    top:50% !important;
    left:50% !important;
    transform:translate(-50%,-50%) scale(0.9) !important;
    background:linear-gradient(to bottom, #ffffff, #f8f9fa) !important;
    background-color:#ffffff !important;
    border-radius:16px !important;
    width:280px !important;
    max-width:90% !important;
    box-shadow:0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05) !important;
    z-index:9999999 !important;
    opacity:0 !important;
    pointer-events:none !important;
    transition:all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    overflow:hidden !important;
    visibility:hidden !important;
    color:#000000 !important;
    display:block !important;
}

#iosToast.show,
.ios-toast.show{
    visibility:visible !important;
    opacity:1 !important;
    transform:translate(-50%,-50%) scale(1) !important;
    pointer-events:auto !important;
    display:block !important;
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
    z-index:9999998 !important;
    opacity:0 !important;
    pointer-events:none !important;
    transition:opacity 0.3s !important;
    visibility:hidden !important;
}

.ios-toast-overlay.show{
    visibility:visible !important;
    opacity:1 !important;
    pointer-events:auto !important;
}

.ios-toast.show .ios-toast-buttons,
.ios-toast.show .ios-toast-button{
    pointer-events:auto !important;
}

#iosToastTitle,
.ios-toast-title{
    font-size:17px !important;
    font-weight:600 !important;
    color:#000000 !important;
    text-align:center !important;
    padding:18px 20px 0 !important;
    line-height:1.4 !important;
    margin:0 !important;
    background:transparent !important;
}

.ios-toast-title:empty{
    display:none !important;
    padding:0 !important;
    margin:0 !important;
}

#iosToastMessage,
.ios-toast-message{
    font-size:16px !important;
    color:#1f2937 !important;
    color:#000000 !important;
    text-align:center !important;
    line-height:1.6 !important;
    padding:18px 20px 20px !important;
    white-space:pre-line !important;
    word-break:break-word !important;
    min-height:auto !important;
    font-weight:500 !important;
    background:transparent !important;
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
    }

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

// ✅ 页面加载时立即初始化（不等待DOMContentLoaded）
// 确保在showToast()被调用前就已经初始化完成
(function() {
    // 如果body已存在，立即初始化
    if (document.body) {
        initIOSToast();
    } else {
        // 如果body不存在，等待它创建
        const checkBody = setInterval(() => {
            if (document.body) {
                clearInterval(checkBody);
                initIOSToast();
            }
        }, 10);

        // 同时监听DOMContentLoaded作为备用
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                clearInterval(checkBody);
                if (!document.getElementById('iosToastOverlay')) {
                    initIOSToast();
                }
            }, { once: true });
        }

        // 3秒后强制初始化（防止无限等待）
        setTimeout(() => {
            clearInterval(checkBody);
            if (!document.getElementById('iosToastOverlay')) {
                initIOSToast();
            }
        }, 3000);
    }
})();

// ✅ 导出全局函数 - 确保在任何情况下都能访问
window.showToast = showToast;
window.showConfirm = showConfirm;

// ✅ 立即检查并初始化（防止showToast被调用时还未初始化）
if (typeof window.showToast === 'function') {
    console.log('[ios-toast.js] showToast函数已导出');
} else {
    console.error('[ios-toast.js] showToast函数导出失败！');
}
