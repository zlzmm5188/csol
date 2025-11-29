/**

// 防止事件监听器重复注册
function addEventListenerOnce(element, event, handler, options) {
    if (!element) return;
    if (!element._bindedEvents) element._bindedEvents = {};
    const key = event + '_' + (handler.name || 'anonymous');
    if (!element._bindedEvents[key]) {
        element._bindedEvents[key] = true;
        element.addEventListener(event, handler, options || { passive: false });
    }
}


 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 全站统一右滑返回控制
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能：
 * 1. 右滑手势返回到上级页面（不是浏览器历史返回）
 * 2. 禁止所有 history.back() 行为
 * 3. 返回按钮统一跳转到上级页面
 * 4. 登录页、注册页、首页不触发返回
 *
 * 使用方法：
 * 在需要返回功能的页面加载此脚本：
 * <script src="js/swipe-back.js"></script>
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 页面层级映射表（定义每个页面的上级页面）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const PAGE_PARENT = {
        // ===== 消息相关 =====
        'message-chat.html': 'message.html',
        'message-detail.html': 'message.html',

        // ===== 快讯/新闻相关 =====
        'news-detail.html': 'news.html',
        'news.html': 'app.html',
        'company-news.html': 'app.html',
        'company-news-detail.html': 'company-news.html',

        // ===== 项目相关 =====
        'project-detail.html': 'projects.html',
        'projects.html': 'app.html',
        'projects-list.html': 'app.html',
        'my-investments.html': 'profile.html',
        'project-managers.html': 'app.html',

        // ===== 个人中心二级页面 =====
        'vip-level.html': 'profile.html',
        'vip-benefits.html': 'profile.html',
        'daily-checkin.html': 'profile.html',
        'reward-rules.html': 'profile.html',
        'set-pay-password.html': 'profile.html',
        'reset-password.html': 'profile.html',
        'reset-password-face.html': 'login.html',

        // ===== 资金相关 =====
        'recharge.html': 'profile.html',
        'withdraw.html': 'profile.html',
        'points-exchange.html': 'profile.html',
        'points-exchange-history.html': 'points-exchange.html',
        'ribao.html': 'profile.html',
        'ribao-history.html': 'ribao.html',
        'team-rewards.html': 'profile.html',

        // ===== 市场相关 =====
        'market.html': 'app.html',
        'market-detail.html': 'market.html',

        // ===== 教育相关 =====
        'education.html': 'app.html',
        'education-detail.html': 'education.html',

        // ===== 政策/文档相关 =====
        'policy.html': 'app.html',
        'policy-detail.html': 'policy.html',
        'policy-detail-1.html': 'policy.html',
        'policy-detail-2.html': 'policy.html',
        'policy-detail-3.html': 'policy.html',
        'policy-detail-4.html': 'policy.html',
        'policy-detail-5.html': 'policy.html',
        'policy-detail-6.html': 'policy.html',
        'policy-detail-7.html': 'policy.html',
        'policy-detail-8.html': 'policy.html',
        'policy-detail-9.html': 'policy.html',
        'policy-detail-10.html': 'policy.html',

        // ===== 商城相关 =====
        'shop.html': 'app.html',
        'shop-detail.html': 'shop.html',

        // ===== 新手指南相关 =====
        'guide.html': 'app.html',
        'guide-advisor.html': 'app.html',
        'lawyer-team.html': 'app.html',
        'brokers.html': 'app.html',

        // ===== 其他 =====
        'profit-calendar.html': 'profile.html',
        'trial-money.html': 'profile.html',

        // ===== Profile 相关页面默认返回 app.html =====
        'profile.html': 'app.html'
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 不需要返回功能的页面（顶级页面）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const NO_BACK_PAGES = [
        'login.html',
        'register.html',
        'app.html',
        'index.html'
    ];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 获取当前页面文件名
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 获取上级页面
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function getParentPage() {
        const currentPage = getCurrentPage();
        return PAGE_PARENT[currentPage] || 'app.html';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 执行返回操作（跳转到上级页面）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function navigateToParent() {
        const parentPage = getParentPage();
        console.log('[右滑返回] 返回上级:', parentPage);
        window.location.href = parentPage;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 检查当前页面是否需要返回功能
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function shouldEnableSwipeBack() {
        const currentPage = getCurrentPage();
        return !NO_BACK_PAGES.includes(currentPage);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 右滑手势检测
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwipeGesture = false;

    function handleTouchStart(e) {
        // 只检测从屏幕左缘 20px 区域开始的滑动
        if (e.touches[0].clientX > 20) {
            return;
        }

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwipeGesture = true;
    }

    function handleTouchMove(e) {
        if (!isSwipeGesture) return;

        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;

        const deltaX = touchCurrentX - touchStartX;
        const deltaY = touchCurrentY - touchStartY;

        // 如果垂直滑动距离大于水平滑动，取消手势
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            isSwipeGesture = false;
            return;
        }

        // 如果是向左滑动，取消手势
        if (deltaX < 0) {
            isSwipeGesture = false;
            return;
        }
    }

    function handleTouchEnd(e) {
        if (!isSwipeGesture) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndTime = Date.now();

        const deltaX = touchEndX - touchStartX;
        const deltaTime = touchEndTime - touchStartTime;
        const velocity = deltaX / deltaTime; // px/ms

        // 触发条件：
        // 1. 滑动距离超过 60px
        // 2. 或者快速滑动（速度 > 0.5 px/ms）且距离 > 30px
        const isLongSwipe = deltaX > 60;
        const isFastSwipe = velocity > 0.5 && deltaX > 30;

        if (isLongSwipe || isFastSwipe) {
            console.log('[右滑返回] 手势触发 - 距离:', deltaX.toFixed(0), 'px, 速度:', velocity.toFixed(2), 'px/ms');
            navigateToParent();
        }

        // 重置状态
        isSwipeGesture = false;
        touchStartX = 0;
        touchStartY = 0;
        touchStartTime = 0;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 初始化右滑返回
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function initSwipeBack() {
        if (!shouldEnableSwipeBack()) {
            console.log('[右滑返回] 当前页面不需要返回功能:', getCurrentPage());
            return;
        }

        // 绑定手势事件
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        console.log('[右滑返回] 已启用 - 上级页面:', getParentPage());
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 劫持返回按钮点击事件
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function hijackBackButtons() {
        if (!shouldEnableSwipeBack()) return;

        // 使用事件委托劫持所有返回按钮
        document.addEventListener('click', function(e) {
            const backBtn = e.target.closest('.back-btn, .back-btn-projects, .detail-back');
            if (backBtn) {
                // 如果按钮有 onclick 或 href，检查是否使用了 history.back()
                const onclickAttr = backBtn.getAttribute('onclick');
                const href = backBtn.getAttribute('href');

                if (onclickAttr && (onclickAttr.includes('history.back') || onclickAttr.includes('history.go'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateToParent();
                    return;
                }

                if (href === 'javascript:history.back()' || href === 'javascript:history.go(-1)') {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateToParent();
                    return;
                }
            }
        }, true); // 使用捕获阶段，优先级更高

        console.log('[右滑返回] 已劫持返回按钮事件');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 禁用浏览器原生返回手势
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function disableBrowserSwipeBack() {
        // 添加CSS样式
        const style = document.createElement('style');
        style.id = 'swipe-back-style';
        style.textContent = `
            html, body {
                overscroll-behavior-x: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 暴露全局返回函数（供返回按钮使用）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    window.goToParentPage = navigateToParent;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 页面加载时初始化
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            disableBrowserSwipeBack();
            initSwipeBack();
            hijackBackButtons();
        });
    } else {
        disableBrowserSwipeBack();
        initSwipeBack();
        hijackBackButtons();
    }

})();
