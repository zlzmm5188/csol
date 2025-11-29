/**
 * 页面生命周期管理 - 统一脚本
 * 当页面不可见时自动暂停所有动态操作，防止手机发烫
 */

(function() {
    'use strict';

    // 存储所有定时器和动画帧
    const timers = {
        intervals: new Set(),
        timeouts: new Set(),
        rafs: new Set()
    };

    // 页面是否可见
    let isPageVisible = !document.hidden;

    // 拦截 setInterval
    const originalSetInterval = window.setInterval;
    window.setInterval = function(...args) {
        const id = originalSetInterval.apply(this, args);
        timers.intervals.add(id);
        return id;
    };

    // 拦截 clearInterval
    const originalClearInterval = window.clearInterval;
    window.clearInterval = function(id) {
        timers.intervals.delete(id);
        return originalClearInterval.call(this, id);
    };

    // 拦截 setTimeout
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(...args) {
        const id = originalSetTimeout.apply(this, args);
        timers.timeouts.add(id);
        return id;
    };

    // 拦截 clearTimeout
    const originalClearTimeout = window.clearTimeout;
    window.clearTimeout = function(id) {
        timers.timeouts.delete(id);
        return originalClearTimeout.call(this, id);
    };

    // 拦截 requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(...args) {
        const id = originalRAF.apply(this, args);
        timers.rafs.add(id);
        return id;
    };

    // 拦截 cancelAnimationFrame
    const originalCAF = window.cancelAnimationFrame;
    window.cancelAnimationFrame = function(id) {
        timers.rafs.delete(id);
        return originalCAF.call(this, id);
    };

    // 清除所有定时器
    function pauseAllTimers() {
        console.log('[生命周期] 页面不可见，暂停所有定时器');

        // 清除所有 interval
        timers.intervals.forEach(id => {
            originalClearInterval.call(window, id);
        });

        // 清除所有 timeout
        timers.timeouts.forEach(id => {
            originalClearTimeout.call(window, id);
        });

        // 清除所有 RAF
        timers.rafs.forEach(id => {
            originalCAF.call(window, id);
        });

        // 清空集合
        timers.intervals.clear();
        timers.timeouts.clear();
        timers.rafs.clear();
    }

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', function() {
        isPageVisible = !document.hidden;

        if (document.hidden) {
            console.log('[生命周期] 页面隐藏');
            pauseAllTimers();

            // 触发自定义事件，让页面可以做额外清理
            window.dispatchEvent(new Event('pageHidden'));
        } else {
            console.log('[生命周期] 页面显示');

            // 触发自定义事件，让页面可以恢复
            window.dispatchEvent(new Event('pageVisible'));
        }
    });

    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        console.log('[生命周期] 页面卸载，清理所有定时器');
        pauseAllTimers();
    });

    // 页面完全卸载
    window.addEventListener('unload', function() {
        pauseAllTimers();
    });

    // 暴露API
    window.PageLifecycle = {
        isVisible: () => isPageVisible,
        getTimerCount: () => ({
            intervals: timers.intervals.size,
            timeouts: timers.timeouts.size,
            rafs: timers.rafs.size
        }),
        pauseAll: pauseAllTimers
    };

    console.log('[生命周期] 管理器已加载');
})();
