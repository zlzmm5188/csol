/**
 * 智能导航系统 - 层级感知的右滑返回
 * 禁止左滑，右滑返回上级（不是上一页），首页禁止滑动
 */

(function() {
    'use strict';

    // 页面层级结构定义
    const PAGE_HIERARCHY = {
        // 首页（顶级）
        'index.html': { level: 0, parent: null },
        
        // 一级页面（从首页进入）
        'profile.html': { level: 1, parent: 'index.html' },
        'projects.html': { level: 1, parent: 'index.html' },
        'market.html': { level: 1, parent: 'index.html' },
        'finance.html': { level: 1, parent: 'index.html' },
        
        // 二级页面（从profile进入）
        'my-investments.html': { level: 2, parent: 'profile.html' },
        'team-rewards.html': { level: 2, parent: 'profile.html' },
        'vip-level.html': { level: 2, parent: 'profile.html' },
        'invite-share.html': { level: 2, parent: 'profile.html' },
        'points-exchange.html': { level: 2, parent: 'profile.html' },
        'ribao.html': { level: 2, parent: 'profile.html' },
        'messages.html': { level: 2, parent: 'profile.html' },
        'bank-cards.html': { level: 2, parent: 'profile.html' },
        
        // 二级页面（从finance进入）
        'recharge.html': { level: 2, parent: 'finance.html' },
        'withdraw.html': { level: 2, parent: 'finance.html' },
        'records.html': { level: 2, parent: 'finance.html' },
        
        // 三级页面
        'project-detail.html': { level: 3, parent: 'projects.html' },
        'ribao-history.html': { level: 3, parent: 'ribao.html' },
        'points-exchange-history.html': { level: 3, parent: 'points-exchange.html' },
        'profit-calendar.html': { level: 3, parent: 'my-investments.html' },
        'vip-benefits.html': { level: 3, parent: 'vip-level.html' },
        
        // 独立页面（可以从多处进入，返回profile）
        'daily-checkin.html': { level: 2, parent: 'profile.html' },
        'trial-money.html': { level: 2, parent: 'profile.html' },
        'newbie-bonus.html': { level: 2, parent: 'profile.html' },
        'kyc-verification.html': { level: 2, parent: 'profile.html' },
        
        // 登录注册（返回首页）
        'login.html': { level: 1, parent: 'index.html' },
        'register.html': { level: 1, parent: 'index.html' },
        'forgot.html': { level: 1, parent: 'login.html' },
    };

    // 获取当前页面文件名
    function getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    }

    // 获取上级页面
    function getParentPage(currentPage) {
        const pageInfo = PAGE_HIERARCHY[currentPage];
        if (!pageInfo || !pageInfo.parent) {
            return null;
        }
        return pageInfo.parent;
    }

    // 检查是否是首页
    function isHomePage(page) {
        const pageInfo = PAGE_HIERARCHY[page];
        return pageInfo && pageInfo.level === 0;
    }

    // 滑动手势处理
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    const config = {
        minSwipeDistance: 80,      // 最小滑动距离
        maxSwipeTime: 300,         // 最大滑动时间（ms）
        maxVerticalDistance: 50,   // 最大垂直偏移
        edgeThreshold: 50,         // 屏幕边缘阈值
    };

    document.addEventListener('touchstart', function(e) {
        const currentPage = getCurrentPage();
        
        // 首页禁止所有滑动返回
        if (isHomePage(currentPage)) {
            return;
        }

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwiping = false;

        // 只在屏幕左边缘开始的滑动才响应（右滑返回）
        if (touchStartX < config.edgeThreshold) {
            isSwiping = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!isSwiping) return;

        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;
        const deltaX = touchCurrentX - touchStartX;
        const deltaY = Math.abs(touchCurrentY - touchStartY);

        // 如果垂直滑动距离太大，取消手势
        if (deltaY > config.maxVerticalDistance) {
            isSwiping = false;
            return;
        }

        // 禁止左滑（deltaX < 0）
        if (deltaX < 0) {
            isSwiping = false;
            return;
        }

        // 右滑超过一定距离时显示视觉反馈
        if (deltaX > 30) {
            document.body.style.transform = `translateX(${Math.min(deltaX * 0.3, 50)}px)`;
            document.body.style.transition = 'none';
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!isSwiping) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        const deltaTime = Date.now() - touchStartTime;

        // 恢复视觉效果
        document.body.style.transform = '';
        document.body.style.transition = 'transform 0.3s ease';

        // 判断是否是有效的右滑手势
        const isValidSwipe = 
            deltaX > config.minSwipeDistance &&
            deltaY < config.maxVerticalDistance &&
            deltaTime < config.maxSwipeTime;

        if (isValidSwipe) {
            const currentPage = getCurrentPage();
            const parentPage = getParentPage(currentPage);

            console.log('[导航] 右滑返回', {
                当前页面: currentPage,
                上级页面: parentPage,
                滑动距离: deltaX
            });

            if (parentPage) {
                // 添加页面切换动画
                document.body.style.opacity = '0.7';
                setTimeout(() => {
                    window.location.href = parentPage;
                }, 150);
            } else {
                console.log('[导航] 当前页面没有上级页面');
            }
        }

        isSwiping = false;
    }, { passive: true });

    // 禁止浏览器默认的左右滑动手势
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // 阻止浏览器的前进后退手势
    window.addEventListener('popstate', function(e) {
        const currentPage = getCurrentPage();
        const parentPage = getParentPage(currentPage);
        
        if (parentPage) {
            e.preventDefault();
            window.location.href = parentPage;
        }
    });

    console.log('[智能导航] 已加载', {
        当前页面: getCurrentPage(),
        层级信息: PAGE_HIERARCHY[getCurrentPage()],
        是否首页: isHomePage(getCurrentPage())
    });

})();
