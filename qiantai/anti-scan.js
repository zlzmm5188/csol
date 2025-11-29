/**
 * 反扫描检测系统
 * 用于保护登录页面和网站内容不被爬虫扫描
 */

(function() {
    'use strict';

    // 检测状态
    const scanDetection = {
        isBot: false,
        isVerified: false,
        checks: {
            userAgent: false,
            browserFeatures: false,
            canvasFingerprint: false,
            webdriver: false,
            chrome: false,
            plugins: false
        }
    };

    // 1. 检测 User-Agent
    function checkUserAgent() {
        const ua = navigator.userAgent.toLowerCase();
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'headless', 'phantom',
            'selenium', 'webdriver', 'puppeteer', 'playwright', 'curl',
            'wget', 'python-requests', 'go-http', 'java/', 'scrapy',
            'httpclient', 'okhttp', 'apache-httpclient', 'python-urllib'
        ];

        const isBot = botPatterns.some(pattern => ua.includes(pattern));
        if (isBot) {
            scanDetection.isBot = true;
            scanDetection.checks.userAgent = false;
            return false;
        }
        scanDetection.checks.userAgent = true;
        return true;
    }

    // 2. 检测 WebDriver（Selenium等自动化工具）
    function checkWebDriver() {
        // 检测常见的自动化工具标识
        if (navigator.webdriver === true) {
            scanDetection.isBot = true;
            scanDetection.checks.webdriver = false;
            return false;
        }

        // 检测被修改的webdriver属性（某些反检测工具会这样做）
        try {
            const descriptor = Object.getOwnPropertyDescriptor(navigator, 'webdriver');
            if (descriptor && descriptor.value === true) {
                scanDetection.isBot = true;
                scanDetection.checks.webdriver = false;
                return false;
            }
        } catch(e) {}

        // 检测 Playwright 特殊特征
        if (window.__playwright || window.__pw_ || window.playwright) {
            scanDetection.isBot = true;
            scanDetection.checks.webdriver = false;
            console.warn('[反扫描] 检测到 Playwright 全局变量');
            return false;
        }

        // 检测 Playwright 注入的脚本标记
        if (document.querySelector('script[data-playwright]')) {
            scanDetection.isBot = true;
            scanDetection.checks.webdriver = false;
            console.warn('[反扫描] 检测到 Playwright 脚本标记');
            return false;
        }

        // 检测 Playwright 特有的 navigator 属性异常
        if (navigator.plugins && navigator.plugins.length === 0 && navigator.languages && navigator.languages.length === 0) {
            scanDetection.isBot = true;
            scanDetection.checks.webdriver = false;
            console.warn('[反扫描] 检测到异常的空插件和语言列表（可能是 Playwright）');
            return false;
        }

        // 检测Chrome DevTools Protocol
        if (window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect) {
            // 正常Chrome浏览器
            scanDetection.checks.chrome = true;
        }

        // 如果没有明确检测到webdriver，允许通过（降低误判率）
        scanDetection.checks.webdriver = true;
        return true;
    }

    // 3. 检测浏览器插件
    function checkPlugins() {
        try {
            const plugins = navigator.plugins;
            if (plugins && plugins.length > 0) {
                scanDetection.checks.plugins = true;
                return true;
            }
        } catch(e) {}

        // headless浏览器通常没有插件
        scanDetection.checks.plugins = false;
        return false;
    }

    // 4. 检测浏览器特征
    function checkBrowserFeatures() {
        let score = 0;

        // WebGL支持
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) score++;
        } catch(e) {}

        // Canvas渲染
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('检测', 2, 2);
            if (canvas.toDataURL().length > 100) score++;
        } catch(e) {}

        // 屏幕信息
        if (screen.width > 0 && screen.height > 0) score++;
        if (window.innerWidth > 0 && window.innerHeight > 0) score++;

        // 时区
        try {
            Intl.DateTimeFormat().resolvedOptions().timeZone;
            score++;
        } catch(e) {}

        // 语言
        if (navigator.language || navigator.languages) score++;

        // 需要至少4个特征
        if (score >= 4) {
            scanDetection.checks.browserFeatures = true;
            return true;
        }
        return false;
    }

    // 5. Canvas指纹检测
    function checkCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('检测', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('检测', 4, 17);

            const fingerprint = canvas.toDataURL();
            if (fingerprint && fingerprint.length > 100) {
                scanDetection.checks.canvasFingerprint = true;
                return true;
            }
        } catch(e) {}
        return false;
    }

    // 综合验证
    function verifyUser() {
        checkUserAgent();
        checkWebDriver();
        checkPlugins();
        checkBrowserFeatures();
        checkCanvasFingerprint();

        const checks = scanDetection.checks;

        // 关键检测1：User-Agent必须通过（不能是爬虫）
        if (!checks.userAgent) {
            scanDetection.isBot = true;
            console.log('[反扫描] User-Agent检测失败');
            return false;
        }

        // 关键检测2：浏览器特征必须通过（至少4个特征）
        // 这是最重要的检测，因为headless浏览器通常缺少这些特征
        if (!checks.browserFeatures) {
            scanDetection.isBot = true;
            console.log('[反扫描] 浏览器特征检测失败');
            return false;
        }

        // WebDriver检测不是必须的（某些浏览器可能没有这个属性）
        // 但如果明确检测到webdriver=true，则拒绝

        // 至少需要2个检测通过（降低误判率，但保持安全性）
        const passedCount = Object.values(checks).filter(v => v === true).length;
        if (passedCount < 2) {
            scanDetection.isBot = true;
// console.log('[反扫描] 通过检测数不足:', passedCount); // 性能优化：已注释
            return false;
        }

        scanDetection.isVerified = true;
        return true;
    }

    // 隐藏页面内容（如果是爬虫）
    function hideContent() {
        // 隐藏所有主要内容
        const style = document.createElement('style');
        style.id = 'anti-scan-style';
        style.textContent = `
            body > *:not(script) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
            body {
                background: #091c2e !important;
                overflow: hidden !important;
            }
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #091c2e;
                z-index: 999999;
            }
        `;
        document.head.appendChild(style);

        // 阻止所有后续脚本执行
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'SCRIPT' && node.src && !node.src.includes('anti-scan')) {
                        node.remove();
                    }
                });
            });
        });

        observer.observe(document.head, { childList: true, subtree: true });
        observer.observe(document.body, { childList: true, subtree: true });

        // 阻止所有网络请求（除了必要的）
        // 注意：不阻止页面跳转，只阻止fetch请求
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            // 允许同源的页面跳转相关请求
            const url = args[0];
            if (typeof url === 'string' && (url.startsWith('/') || url.startsWith(window.location.origin))) {
                // 允许页面跳转，但阻止API请求
                if (url.includes('/') || url.includes('api.') || url.includes('v2api.')) {
                    return Promise.reject(new Error('Blocked'));
                }
            }
            return originalFetch.apply(this, args);
        };

// console.log('[反扫描] 检测到爬虫，已隐藏页面内容'); // 性能优化：已注释
    }

    // 初始化检测
    function init() {
        // 立即执行第一次检测
        if (!verifyUser()) {
            hideContent();
            return;
        }

        // 延迟再次检测（防止动态加载的爬虫）
        setTimeout(() => {
            if (!verifyUser()) {
                hideContent();
            }
        }, 1000);

        // 监听页面变化，持续检测
        const observer = new MutationObserver(() => {
            if (!verifyUser()) {
                hideContent();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 导出检测结果（供其他脚本使用）
    window.scanDetection = scanDetection;

})();
