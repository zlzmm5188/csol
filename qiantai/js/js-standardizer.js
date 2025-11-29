/**
 * JavaScript 代码规范化和内存泄露修复工具
 * 统一管理所有JS文件的内存泄露问题
 */

(function() {
    'use strict';

    // 存储所有事件监听器和定时器的引用
    const eventListeners = new Map();
    const timers = new Set();
    const intervals = new Set();

    /**
     * 安全的事件监听器包装器
     * 自动追踪和清理
     */
    window.safeAddEventListener = function(element, event, handler, options) {
        if (!element) return null;

        const key = `${event}_${handler.name || 'anonymous'}_${Date.now()}`;
        const wrappedHandler = function(...args) {
            try {
                return handler.apply(this, args);
            } catch (error) {
                console.error(`[事件错误] ${event}:`, error);
            }
        };

        element.addEventListener(event, wrappedHandler, options);

        // 存储引用以便清理
        if (!eventListeners.has(element)) {
            eventListeners.set(element, []);
        }
        eventListeners.get(element).push({
            event: event,
            handler: wrappedHandler,
            originalHandler: handler,
            key: key
        });

        // 返回清理函数
        return function() {
            element.removeEventListener(event, wrappedHandler, options);
            const listeners = eventListeners.get(element);
            if (listeners) {
                const index = listeners.findIndex(l => l.key === key);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
                if (listeners.length === 0) {
                    eventListeners.delete(element);
                }
            }
        };
    };

    /**
     * 安全的setTimeout包装器
     */
    window.safeSetTimeout = function(callback, delay, ...args) {
        const id = setTimeout(() => {
            timers.delete(id);
            try {
                callback.apply(null, args);
            } catch (error) {
                console.error('[定时器错误]:', error);
            }
        }, delay);
        timers.add(id);
        return id;
    };

    /**
     * 安全的setInterval包装器
     */
    window.safeSetInterval = function(callback, delay, ...args) {
        const id = setInterval(() => {
            try {
                callback.apply(null, args);
            } catch (error) {
                console.error('[定时器错误]:', error);
            }
        }, delay);
        intervals.add(id);
        return id;
    };

    /**
     * 清理所有事件监听器
     */
    window.clearAllEventListeners = function() {
        let cleared = 0;
        eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler, originalHandler }) => {
                try {
                    element.removeEventListener(event, handler);
                    cleared++;
                } catch (e) {
                    console.warn('清理事件监听器失败:', e);
                }
            });
        });
        eventListeners.clear();
        console.log(`🧹 清理了 ${cleared} 个事件监听器`);
        return cleared;
    };

    /**
     * 清理所有定时器
     */
    window.clearAllTimers = function() {
        let cleared = 0;

        // 清理setTimeout
        timers.forEach(id => {
            try {
                clearTimeout(id);
                cleared++;
            } catch (e) {}
        });
        timers.clear();

        // 清理setInterval
        intervals.forEach(id => {
            try {
                clearInterval(id);
                cleared++;
            } catch (e) {}
        });
        intervals.clear();

        console.log(`🧹 清理了 ${cleared} 个定时器`);
        return cleared;
    };

    /**
     * 完全清理（定时器 + 事件监听器）
     */
    window.cleanupAll = function() {
        const timerCount = window.clearAllTimers();
        const listenerCount = window.clearAllEventListeners();
        console.log(`✅ 完全清理完成: ${timerCount} 个定时器, ${listenerCount} 个事件监听器`);
        return { timers: timerCount, listeners: listenerCount };
    };

    /**
     * 页面卸载时自动清理
     */
    const cleanupOnUnload = function() {
        window.cleanupAll();
    };

    window.addEventListener('beforeunload', cleanupOnUnload, { once: true });
    window.addEventListener('unload', cleanupOnUnload, { once: true });
    window.addEventListener('pagehide', cleanupOnUnload, { once: true });

    /**
     * 页面可见性变化时清理（针对SPA）
     */
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // 页面隐藏时，清理非关键定时器
            const timerCount = timers.size + intervals.size;
            if (timerCount > 20) {
                console.warn(`⚠️ 检测到${timerCount}个定时器，页面隐藏时清理部分`);
                // 只清理setTimeout，保留setInterval（可能是关键功能）
                timers.forEach(id => {
                    try {
                        clearTimeout(id);
                        timers.delete(id);
                    } catch (e) {}
                });
            }
        }
    });

    /**
     * 定期检查内存使用情况
     */
    if (window.performance && window.performance.memory) {
        setInterval(() => {
            const memory = window.performance.memory;
            const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
            const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);

            // 如果内存使用超过50MB，发出警告
            if (parseFloat(usedMB) > 50) {
                console.warn(`⚠️ 内存使用较高: ${usedMB}MB / ${totalMB}MB`);
                console.warn(`   活跃定时器: ${timers.size + intervals.size}`);
                console.warn(`   事件监听器: ${eventListeners.size}`);
            }
        }, 30000); // 每30秒检查一次
    }

    console.log('✅ JavaScript 规范化工具已启动');

    // 导出到全局
    window.JSStandardizer = {
        clearAll: window.cleanupAll,
        clearTimers: window.clearAllTimers,
        clearListeners: window.clearAllEventListeners,
        getStats: function() {
            return {
                timers: timers.size,
                intervals: intervals.size,
                listeners: eventListeners.size
            };
        }
    };

})();
