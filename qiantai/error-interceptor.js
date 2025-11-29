(function () {

    console.log("✓ ErrorInterceptor 已加载");



    window.addEventListener("unhandledrejection", (event) => {

        const reason = event.reason;



        try {

            if (!reason) return;

            const data = reason.data || reason;



            if (!data) return;



            // 如果后端返回 未登录，则自动跳转

            if (data.code === 401 || data.msg === "请先登录") {

                console.warn("[ErrorInterceptor] 检测到未登录 → 跳转 login.html");

                window.location.href = "login.html";

            }



        } catch (e) {

            console.error("[ErrorInterceptor] 自身异常:", e);

        }

    });



})();
