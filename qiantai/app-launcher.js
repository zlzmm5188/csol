/**
 * APP启动器和下载引导
 * 用于注册成功后拉起APP或引导下载
 */

const AppLauncher = {
    // APP配置
    config: {
        scheme: 'providence://',  // APP的URL Scheme
        androidPackage: 'com.providence.app',  // 安卓包名
        iosAppId: 'idXXXXXXXX',  // iOS App ID
        downloadPage: '/app-download.html',  // 下载页面路径
        timeout: 2500  // 拉起超时时间（毫秒）
    },

    /**
     * 检测是否安装了APP
     */
    async tryLaunchApp(params = {}) {
// console.log('[AppLauncher] 尝试拉起APP...'); // 性能优化：已注释

        const startTime = Date.now();
        const launchUrl = this.buildLaunchUrl(params);

        // 尝试拉起APP
        window.location.href = launchUrl;

        // 监听页面可见性变化（APP成功拉起会导致页面进入后台）
        let launched = false;
        const visibilityHandler = () => {
            if (document.hidden) {
                launched = true;
// console.log('[AppLauncher] APP已拉起'); // 性能优化：已注释
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);

        // 等待一段时间后检测
        await new Promise(resolve => setTimeout(resolve, this.config.timeout));
        document.removeEventListener('visibilitychange', visibilityHandler);

        // 检查是否成功拉起
        const timeElapsed = Date.now() - startTime;
        if (!launched && timeElapsed < this.config.timeout + 500) {
            // APP未安装，跳转到下载页面
// console.log('[AppLauncher] APP未安装，跳转下载页面'); // 性能优化：已注释
            this.goToDownloadPage();
        } else {
// console.log('[AppLauncher] APP拉起成功或用户已切换'); // 性能优化：已注释
        }
    },

    /**
     * 构建拉起URL
     */
    buildLaunchUrl(params) {
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');

        return `${this.config.scheme}?${queryString}`;
    },

    /**
     * 跳转到下载页面
     */
    goToDownloadPage() {
        window.location.href = this.config.downloadPage;
    },

    /**
     * 直接跳转到下载页面（不尝试拉起）
     */
    downloadOnly() {
        this.goToDownloadPage();
    }
};

// 导出到全局
window.AppLauncher = AppLauncher;

// 使用示例:
// 1. 注册成功后自动拉起:
//    AppLauncher.tryLaunchApp({ page: 'home', action: 'register_success' });
//
// 2. 直接跳转下载:
//    AppLauncher.downloadOnly();
