// ========== 全局错误拦截器（稳定版） ==========

window.addEventListener("unhandledrejection", (event) => {
    const err = event.reason;
    if (!err) return;

    try {
        const msg = (err.msg || err.message || "").toString();

        // Token失效处理
        if (msg.includes("请先登录") || msg.includes("未登录") || err.code === 401) {
            localStorage.removeItem("providence_token");
            sessionStorage.removeItem("providence_token");
            window.location.href = "login.html";
            return;
        }
    } catch (e) {}

    console.error("[全局错误]", err);
});

console.log("✓ 全局错误拦截器稳定版 已加载");