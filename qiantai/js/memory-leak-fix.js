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


 * Providence 内存泄露修复
 * 自动清理所有定时器和事件监听器
 */

(function() {
    'use strict';

    // 存储所有定时器ID
    window._activeTimers = new Set();
    window._activeIntervals = new Set();

    // 重写setTimeout
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(...args) {
        const id = originalSetTimeout.apply(this, args);
        window._activeTimers.add(id);
        return id;
    };

    // 重写clearTimeout
    const originalClearTimeout = window.clearTimeout;
    window.clearTimeout = function(id) {
        window._activeTimers.delete(id);
        return originalClearTimeout.call(this, id);
    };

    // 重写setInterval
    const originalSetInterval = window.setInterval;
    window.setInterval = function(...args) {
        const id = originalSetInterval.apply(this, args);
        window._activeIntervals.add(id);
        return id;
    };

    // 重写clearInterval
    const originalClearInterval = window.clearInterval;
    window.clearInterval = function(id) {
        window._activeIntervals.delete(id);
        return originalClearInterval.call(this, id);
    };

    /**
     * 清理所有定时器
     */
    window.clearAllTimers = function() {
        let cleared = 0;

        // 清理setTimeout
        window._activeTimers.forEach(id => {
            try {
                originalClearTimeout(id);
                cleared++;
            } catch (e) {}
        });
        window._activeTimers.clear();

        // 清理setInterval
        window._activeIntervals.forEach(id => {
            try {
                originalClearInterval(id);
                cleared++;
            } catch (e) {}
        });
        window._activeIntervals.clear();

        console.log(`🧹 清理了 ${cleared} 个定时器`);
        return cleared;
    };

    /**
     * 页面卸载时自动清理
     */
    window.addEventListener('unload', function() {
        window.clearAllTimers();
    });

    window.addEventListener('beforeunload', function() {
        window.clearAllTimers();
    });

    /**
     * 页面隐藏时清理（针对iframe）
     */
    window.addEventListener('pagehide', function() {
        window.clearAllTimers();
    });

    // 在iframe中时，父窗口切换页面前清理
    if (window.parent !== window) {
        // 定期检查是否还在显示
        const checkInterval = setInterval(() => {
            try {
                if (!document.hasFocus()) {
                    // 页面失去焦点，可能要切换了
                    const timerCount = window._activeTimers.size + window._activeIntervals.size;
                    if (timerCount > 10) {
                        console.warn(`⚠️ 检测到${timerCount}个定时器，自动清理`);
                        window.clearAllTimers();
                    }
                }
            } catch (e) {}
        }, 10000); // 每10秒检查

        // 这个检查定时器不能被清理
        window._activeIntervals.delete(checkInterval);
    }

    console.log('✅ 内存泄露防护已启动');

})();
