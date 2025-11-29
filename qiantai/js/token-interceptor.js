// ========== Token 拦截器 - 稳定版 ==========

(function () {
    const token = localStorage.getItem("providence_token") || sessionStorage.getItem("providence_token");

    // 给 fetch 注入 Token
    const originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
        options.headers = options.headers || {};
        if (token) {
            options.headers["Token"] = token;
        }
        return originalFetch(url, options);
    };

    console.log("✓ TokenInterceptor 已加载（稳定版）");
})();