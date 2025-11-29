// ========== Providence 全局稳定化模块（稳定版） ==========

(function () {
    console.log("[GlobalStabilizer] 初始化中...");

    // 不再强制要求 TokenInterceptor 必须先加载！
    // 原来的判断会导致 false alert → 跳回登录。
    const safeCheck = () => {
        const token = localStorage.getItem("providence_token")
            || sessionStorage.getItem("providence_token");

        if (!token) {
            console.warn("[GlobalStabilizer] 未找到 Token，暂停稳定化检查。");
            return;
        }

        // 检查 TokenInterceptor 是否已加载（但不强制要求）
        if (typeof window.TokenInterceptor === 'undefined') {
            console.warn("[GlobalStabilizer] TokenInterceptor 未加载，但继续运行（非强制依赖）");
        } else {
            console.log("[GlobalStabilizer] TokenInterceptor 已就绪");
        }

        console.log("[GlobalStabilizer] Token 已就绪，系统稳定运行。");
    };

    // 延迟执行，不抢在 TokenInterceptor 前
    setTimeout(safeCheck, 500);

    console.log("✓ 全局稳定化模块已加载（稳定版）");
})();