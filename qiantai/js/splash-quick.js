/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence Splash 简化版 - 只在必要时出现
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 使用场景：
 * 1. 首次访问（无splash标记）
 * 2. splash标记过期（>24小时）
 * 3. URL强制参数 (?force_splash=1)
 *
 * 不再出现：
 * - 每次登录后
 * - 正常页面跳转
 * - 24小时内的访问
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    const SPLASH_CONFIG = {
        DISPLAY_TIME: 1500,  // 缩短到1.5秒
        CHECK_KEY: 'splash_checked_at',
        VALID_HOURS: 24,
        TOKEN_KEY: 'providence_token'
    };

    // 检查是否应该跳过splash
    function shouldSkipSplash() {
        // 1. URL强制参数
        if (window.location.search.includes('skip_splash')) {
            console.log('[Splash] URL参数跳过');
            return true;
        }

        // 2. 检查有效期
        try {
            const lastCheck = localStorage.getItem(SPLASH_CONFIG.CHECK_KEY);
            if (lastCheck) {
                const hoursSinceCheck = (Date.now() - parseInt(lastCheck)) / (1000 * 60 * 60);
                if (hoursSinceCheck < SPLASH_CONFIG.VALID_HOURS) {
                    console.log('[Splash] 检测仍有效（',
                        (SPLASH_CONFIG.VALID_HOURS - hoursSinceCheck).toFixed(1), '小时）');
                    return true;
                }
            }
        } catch (e) {
            console.error('[Splash] 检查失败:', e);
        }

        return false;
    }

    // 标记splash已检测
    function markChecked() {
        try {
            localStorage.setItem(SPLASH_CONFIG.CHECK_KEY, Date.now().toString());
            sessionStorage.setItem('from_splash', 'true');
            console.log('[Splash] 已标记');
        } catch (e) {
            console.error('[Splash] 标记失败:', e);
        }
    }

    // 快速跳转
    function quickJump() {
        markChecked();

        // 检查登录状态
        const token = localStorage.getItem(SPLASH_CONFIG.TOKEN_KEY);
        const target = token ? 'index.html' : 'login.html';

        console.log('[Splash] 跳转到:', target);

        // ✅ 立即跳转，无动画延迟
        window.location.href = target;
    }

    // 初始化
    function init() {
        // 如果应该跳过，立即跳转
        if (shouldSkipSplash()) {
            console.log('[Splash] 跳过检测，立即跳转');
            quickJump();
            return;
        }

        console.log('[Splash] 需要检测，显示', SPLASH_CONFIG.DISPLAY_TIME, 'ms');

        // 显示splash，缩短时间后跳转
        setTimeout(quickJump, SPLASH_CONFIG.DISPLAY_TIME);
    }

    // 自动启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[Splash] 简化版已加载');

})();
