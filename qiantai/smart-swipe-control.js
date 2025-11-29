/**
 * 智能滑动控制
 * 根据页面类型自动判断是否允许右滑返回
 */

(function() {
    'use strict';

    // 判断当前页面是否有底部导航栏（主导航页面）
    function hasBottomNav() {
        // 检查是否存在底部导航栏元素
        const navSelectors = [
            '.tabbar',
            '.bottom-nav',
            '.nav-tabs',
            '[class*="tab-bar"]',
            'nav.fixed-bottom'
        ];

        for (const selector of navSelectors) {
            if (document.querySelector(selector)) {
                return true;
            }
        }

        // 通过URL判断（主导航页面）
        const mainPages = ['index.html', 'profile.html', 'projects.html', 'messages.html'];
        const currentPage = window.location.pathname.split('/').pop();
        return mainPages.includes(currentPage);
    }

    // 判断是否应该允许右滑返回
    const allowSwipeBack = !hasBottomNav();

    console.log(`[滑动控制] 当前页面: ${window.location.pathname.split('/').pop()}`);
    console.log(`[滑动控制] ${allowSwipeBack ? '✓ 允许右滑返回' : '✗ 禁止右滑'}`);

    let startX = 0;
    let startY = 0;
    let isScrolling = false;

    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        isScrolling = false;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (isScrolling) return;

        const moveX = e.touches[0].pageX;
        const moveY = e.touches[0].pageY;
        const diffX = moveX - startX;
        const diffY = Math.abs(moveY - startY);

        // 判断是否为水平滑动
        if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
            if (diffX < 0) {
                // 左滑（前进），总是禁止
                e.preventDefault();
                e.stopPropagation();
                return false;
            } else {
                // 右滑（返回）
                if (!allowSwipeBack) {
                    // 主导航页面，禁止右滑
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // 二级页面，允许右滑返回（不做处理）
            }
        } else if (diffY > 10) {
            // 垂直滑动，允许
            isScrolling = true;
        }
    }, { passive: false, capture: true });

    document.addEventListener('touchend', function() {
        isScrolling = false;
    }, { passive: true });

    // 暴露API
    window.SwipeControl = {
        allowSwipeBack: allowSwipeBack,
        hasBottomNav: hasBottomNav()
    };
})();
