// 人脸识别找回密码 - 统一使用config.js的API封装
// 确保在HTML中已加载config.js: <script src="config.js"></script>

// 等待API对象加载
function waitForAPI() {
    return new Promise((resolve) => {
        if (window.API && window.API_CONFIG) {
            resolve();
        } else {
            const check = setInterval(() => {
                if (window.API && window.API_CONFIG) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
            setTimeout(() => {
                clearInterval(check);
                resolve();
            }, 3000);
        }
    });
}

let video = null;
let canvas = null;
let stream = null;
let verifiedUserId = null;

// 页面加载时初始化摄像头
document.addEventListener('DOMContentLoaded', function() {
    video = document.getElementById('faceVideo');
    canvas = document.getElementById('faceCanvas');
    initCamera();
});

// 初始化摄像头
async function initCamera() {
    const tipEl = document.getElementById('faceTips');
    const captureBtn = document.getElementById('captureBtn');

    try {
        // 请求摄像头权限（优先前置摄像头）
        const constraints = {
            video: {
                facingMode: 'user', // 前置摄像头
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        tipEl.textContent = '✅ 摄像头已就绪，请将面部对准框内';
        tipEl.style.color = '#4caf50';
        captureBtn.disabled = false;

    } catch (error) {
        console.error('摄像头启动失败:', error);
        tipEl.textContent = '❌ 无法访问摄像头，请检查权限设置';
        tipEl.style.color = '#f44336';

        showToast('无法访问摄像头，请确保：\n1. 浏览器已授予摄像头权限\n2. 设备有可用的摄像头\n3. 没有其他应用占用摄像头');
    }
}

// 拍摄人脸
async function captureFace() {
    const tipEl = document.getElementById('faceTips');
    const captureBtn = document.getElementById('captureBtn');
    const resultEl = document.getElementById('faceResult');

    // 设置canvas尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制当前帧
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // 转换为base64
    const faceImage = canvas.toDataURL('image/jpeg', 0.8);

    tipEl.textContent = '🔍 正在进行人脸比对...';
    captureBtn.disabled = true;
    resultEl.style.display = 'none';

    try {
        await waitForAPI();
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        // 调用后端人脸比对接口
        const response = await fetch(API_BASE + '/user/user/verifyFaceReset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                face_image: faceImage
            })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析响应失败:', text.substring(0, 100));
            resultEl.className = 'face-result error';
            resultEl.innerHTML = '❌ 验证失败<br>服务器响应格式错误';
            resultEl.style.display = 'block';
            captureBtn.disabled = false;
            return;
        }
        console.log('人脸比对结果:', data);

        if (data.code === 1 || data.code === 200 && data.data && data.data.user_id) {
            // 人脸比对成功
            verifiedUserId = data.data.user_id;
            const username = data.data.username || '';
            const similarity = data.data.similarity || 0;

            resultEl.className = 'face-result success';
            resultEl.innerHTML = `
                ✅ 人脸验证成功<br>
                账号: ${username}<br>
                相似度: ${similarity.toFixed(2)}%<br>
                <small>请设置新密码</small>
            `;
            resultEl.style.display = 'block';

            tipEl.textContent = '✅ 验证通过，请设置新密码';
            tipEl.style.color = '#4caf50';

            // 停止摄像头
            stopCamera();

            // 显示新密码输入区域
            document.getElementById('newPasswordSection').style.display = 'block';

        } else {
            // 人脸比对失败
            resultEl.className = 'face-result error';
            resultEl.innerHTML = `
                ❌ 人脸验证失败<br>
                ${data.msg || '未找到匹配的用户'}<br>
                <small>请重新拍摄或使用其他方式找回</small>
            `;
            resultEl.style.display = 'block';

            tipEl.textContent = '请重新拍摄或调整光线和角度';
            tipEl.style.color = '#f44336';
            captureBtn.disabled = false;
        }

    } catch (error) {
        console.error('人脸验证错误:', error);

        resultEl.className = 'face-result error';
        resultEl.innerHTML = `
            ❌ 验证失败<br>
            ${error.message}<br>
            <small>请检查网络连接或稍后重试</small>
        `;
        resultEl.style.display = 'block';

        tipEl.textContent = '验证失败，请重试';
        tipEl.style.color = '#f44336';
        captureBtn.disabled = false;
    }
}

// 重置密码
async function resetPassword() {
    if (!verifiedUserId) {
        showToast('请先完成人脸验证');
        return;
    }

    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // 验证密码
    if (!newPassword) {
        return showToast('请输入新密码');
    }
    if (newPassword.length < 8) {
        return showToast('密码至少需要8位');
    }
    if (!/[a-z]/.test(newPassword)) {
        return showToast('密码需要包含小写字母');
    }
    if (!/[A-Z]/.test(newPassword)) {
        return showToast('密码需要包含大写字母');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        return showToast('密码需要包含至少一位特殊符号');
    }

    // 验证确认密码
    if (!confirmPassword) {
        return showToast('请输入确认密码');
    }
    if (newPassword !== confirmPassword) {
        return showToast('两次输入的密码不一致');
    }

    try {
        await waitForAPI();
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        // 调用密码重置接口
        const response = await fetch(API_BASE + '/user/user/resetPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: verifiedUserId,
                new_password: newPassword
            })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析响应失败:', text.substring(0, 100));
            showToast('网络错误，请重试');
            return;
        }
        console.log('密码重置结果:', data);

        if (data.code === 1 || data.code === 200) {
            showToast('✅ 密码重置成功！即将跳转登录页面...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showToast(data.msg || '密码重置失败，请重试');
        }

    } catch (error) {
        console.error('密码重置错误:', error);
        showToast('网络错误，请重试');
    }
}

// 停止摄像头
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

// Toast提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        max-width: 80%;
        text-align: center;
        line-height: 1.6;
        white-space: pre-line;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// 页面卸载时停止摄像头
window.addEventListener('beforeunload', function() {
    stopCamera();
});
