/**
 * AI Bot 找回密码流程
 * 集成到messages.html中使用
 */

// 找回密码流程状态
const PASSWORD_RESET_FLOW = {
    INIT: 'init',                    // 初始状态
    ASK_ACCOUNT: 'ask_account',      // 询问账号
    ASK_IDCARD: 'ask_idcard',        // 询问身份证
    VERIFY_FACE: 'verify_face',      // 人脸识别
    SET_PASSWORD: 'set_password',    // 设置新密码
    COMPLETED: 'completed'           // 完成
};

let resetFlowState = PASSWORD_RESET_FLOW.INIT;
let resetData = {
    username: null,
    realname: null,
    idCard: null,
    userId: null,
    forgotUsername: false
};

/**
 * 启动找回密码流程
 */
function startPasswordResetFlow() {
    resetFlowState = PASSWORD_RESET_FLOW.ASK_ACCOUNT;
    resetData = {
        username: null,
        realname: null,
        idCard: null,
        userId: null,
        forgotUsername: false
    };

    const message = `👋 您好！我是Providence AI智能助手。

我将帮助您安全地找回密码。为了保护您的账户安全，需要进行身份验证。

请问您：
1️⃣ 还记得账号
2️⃣ 忘记了账号

请回复数字 1 或 2`;

    return {
        type: 'bot',
        content: message,
        requireInput: true,
        inputType: 'choice',
        choices: ['1', '2']
    };
}

/**
 * 处理用户选择账号/忘记账号
 */
function handleAccountChoice(choice) {
    if (choice === '1' || choice.includes('记得') || choice.includes('知道')) {
        // 用户记得账号
        resetData.forgotUsername = false;
        resetFlowState = PASSWORD_RESET_FLOW.ASK_IDCARD;

        return {
            type: 'bot',
            content: '✅ 好的，请输入您的账号：',
            requireInput: true,
            inputType: 'text',
            placeholder: '请输入账号'
        };
    } else {
        // 用户忘记账号
        resetData.forgotUsername = true;
        resetFlowState = PASSWORD_RESET_FLOW.ASK_IDCARD;

        return {
            type: 'bot',
            content: '✅ 没关系，我会帮您找回账号。\n\n为了确认您的身份，请提供以下信息：',
            requireInput: false
        };
    }
}

/**
 * 显示身份证信息输入表单
 */
function showIdCardForm() {
    const formHtml = `
        <div class="ai-form-card">
            <h3 style="margin:0 0 16px 0;color:#333;">📋 身份验证</h3>
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:6px;color:#666;font-size:14px;">真实姓名</label>
                <input type="text" id="aiRealname" placeholder="请输入真实姓名"
                    style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;margin-bottom:6px;color:#666;font-size:14px;">身份证号</label>
                <input type="text" id="aiIdCard" placeholder="请输入身份证号" maxlength="18"
                    style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
            </div>
            ${!resetData.forgotUsername ? `
            <div style="margin-bottom:16px;">
                <label style="display:block;margin-bottom:6px;color:#666;font-size:14px;">账号</label>
                <input type="text" id="aiUsername" placeholder="请输入账号"
                    style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
            </div>
            ` : ''}
            <button onclick="submitIdCardInfo()"
                style="width:100%;padding:12px;background:linear-gradient(135deg,#d4af37,#f4d03f);color:#1a1a1a;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">
                提交验证
            </button>
        </div>
    `;

    return {
        type: 'bot',
        content: formHtml,
        isHtml: true,
        requireInput: false
    };
}

/**
 * 提交身份证信息
 */
async function submitIdCardInfo() {
    const realname = document.getElementById('aiRealname')?.value.trim();
    const idCard = document.getElementById('aiIdCard')?.value.trim();
    const username = document.getElementById('aiUsername')?.value.trim();

    // 验证姓名
    if (!realname) {
        showToast('请输入真实姓名');
        return;
    }
    if (realname.length < 2) {
        showToast('请输入正确的姓名');
        return;
    }

    // 验证身份证号
    if (!idCard) {
        showToast('请输入身份证号');
        return;
    }
    if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)) {
        showToast('请输入正确的身份证号');
        return;
    }

    // 如果用户记得账号，验证账号
    if (!resetData.forgotUsername) {
        if (!username) {
            showToast('请输入账号');
            return;
        }
        resetData.username = username;
    }

    resetData.realname = realname;
    resetData.idCard = idCard;

    // 显示加载状态
    addBotMessage('🔍 正在验证您的身份信息...');

    try {
        // 调用后端身份证验证接口
        const response = await fetch('https://api.4kp3l0iq.topuser/verify/idcard', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                realname: realname,
                id_card: idCard,
                username: username || null
            })
        });

        const data = await response.json();
// console.log('身份证验证结果:', data); // 性能优化：已注释

        if (data.code === 1 || data.code === 200 && data.data) {
            // 验证成功
            resetData.userId = data.data.user_id;
            resetData.username = data.data.username;

            addBotMessage(`✅ 身份验证成功！

找到您的账户：
• 账号：${resetData.username}

• 姓名：${realname}

接下来需要进行人脸识别验证，以确保账户安全。`);

            setTimeout(() => {
                showFaceVerification();
            }, 1500);

        } else {
            addBotMessage(`❌ 身份验证失败

${data.msg || '未找到匹配的用户信息'}

可能的原因：
• 姓名或身份证号输入错误
${!resetData.forgotUsername ? '• 账号输入错误\n' : ''}• 该信息未在系统中注册

请重新输入或联系客服协助。`);
        }

    } catch (error) {
        console.error('身份验证错误:', error);
        addBotMessage('❌ 网络错误，请检查网络连接后重试');
    }
}

/**
 * 显示人脸识别界面
 */
function showFaceVerification() {
    const faceHtml = `
        <div class="ai-face-verify-card">
            <h3 style="margin:0 0 16px 0;color:#333;text-align:center;">👤 人脸识别验证</h3>

            <div style="background:#000;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;">
                <video id="aiFaceVideo" autoplay playsinline style="width:100%;height:280px;object-fit:cover;"></video>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:180px;border:2px dashed rgba(244,208,63,0.8);border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;"></div>
            </div>
            <canvas id="aiFaceCanvas" style="display:none;"></canvas>

            <div id="aiFaceTips" style="text-align:center;color:#666;font-size:13px;margin-bottom:12px;">
                正在启动摄像头...
            </div>

            <button id="aiFaceCaptureBtn" onclick="captureAIFace()" disabled
                style="width:100%;padding:12px;background:linear-gradient(135deg,#d4af37,#f4d03f);color:#1a1a1a;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">
                拍摄人脸进行验证
            </button>
        </div>
    `;

    addBotMessage(faceHtml, true);

    // 启动摄像头
    setTimeout(() => {
        initAIFaceCamera();
    }, 500);
}

/**
 * 初始化AI人脸摄像头
 */
let aiFaceStream = null;
async function initAIFaceCamera() {
    const video = document.getElementById('aiFaceVideo');
    const tipEl = document.getElementById('aiFaceTips');
    const captureBtn = document.getElementById('aiFaceCaptureBtn');

    if (!video) return;

    try {
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };

        aiFaceStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = aiFaceStream;

        tipEl.textContent = '✅ 请将面部对准框内，点击下方按钮拍照';
        tipEl.style.color = '#4caf50';
        captureBtn.disabled = false;

    } catch (error) {
        console.error('摄像头启动失败:', error);
        tipEl.textContent = '❌ 无法访问摄像头，请检查权限';
        tipEl.style.color = '#f44336';
    }
}

/**
 * 拍摄AI人脸
 */
async function captureAIFace() {
    const video = document.getElementById('aiFaceVideo');
    const canvas = document.getElementById('aiFaceCanvas');
    const tipEl = document.getElementById('aiFaceTips');
    const captureBtn = document.getElementById('aiFaceCaptureBtn');

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const faceImage = canvas.toDataURL('image/jpeg', 0.8);

    tipEl.textContent = '🔍 正在进行人脸比对...';
    captureBtn.disabled = true;

    // 停止摄像头
    if (aiFaceStream) {
        aiFaceStream.getTracks().forEach(track => track.stop());
    }

    try {
        const response = await fetch('https://api.4kp3l0iq.topuser/verify/face-idcard', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: resetData.userId,
                username: resetData.username,
                id_card: resetData.idCard,
                face_image: faceImage
            })
        });

        const data = await response.json();
// console.log('人脸比对结果:', data); // 性能优化：已注释

        if (data.code === 1 || data.code === 200) {
            // 验证成功
            const similarity = data.data?.similarity || 0;

            addBotMessage(`✅ 人脸验证成功！

• 相似度：${similarity.toFixed(2)}%
• 身份确认：${resetData.realname}

• 账号：${resetData.username}

请设置新密码：`);

            setTimeout(() => {
                showPasswordInput();
            }, 1000);

        } else {
            addBotMessage(`❌ 人脸验证失败

${data.msg || '人脸不匹配，请重试'}

您可以：
• 重新拍摄（确保光线充足）
• 联系客服人工协助`);

            captureBtn.disabled = false;
            tipEl.textContent = '请重新拍摄';
        }

    } catch (error) {
        console.error('人脸验证错误:', error);
        addBotMessage('❌ 网络错误，请重试');
        captureBtn.disabled = false;
    }
}

/**
 * 显示密码输入框
 */
function showPasswordInput() {
    const passwordHtml = `
        <div class="ai-password-card">
            <h3 style="margin:0 0 16px 0;color:#333;">🔒 设置新密码</h3>

            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:6px;color:#666;font-size:14px;">新密码</label>
                <input type="password" id="aiNewPassword" placeholder="8位以上，包含大小写字母和特殊符号"
                    style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
                <div style="font-size:11px;color:#999;margin-top:4px;">必须包含大小写字母和特殊符号</div>
            </div>

            <div style="margin-bottom:16px;">
                <label style="display:block;margin-bottom:6px;color:#666;font-size:14px;">确认密码</label>
                <input type="password" id="aiConfirmPassword" placeholder="请再次输入新密码"
                    style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
            </div>

            <button onclick="submitNewPassword()"
                style="width:100%;padding:12px;background:linear-gradient(135deg,#d4af37,#f4d03f);color:#1a1a1a;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">
                确认重置密码
            </button>
        </div>
    `;

    addBotMessage(passwordHtml, true);
}

/**
 * 提交新密码
 */
async function submitNewPassword() {
    const newPassword = document.getElementById('aiNewPassword')?.value.trim();
    const confirmPassword = document.getElementById('aiConfirmPassword')?.value.trim();

    // 验证密码
    if (!newPassword) {
        showToast('请输入新密码');
        return;
    }
    if (newPassword.length < 8) {
        showToast('密码至少需要8位');
        return;
    }
    if (!/[a-z]/.test(newPassword)) {
        showToast('密码需要包含小写字母');
        return;
    }
    if (!/[A-Z]/.test(newPassword)) {
        showToast('密码需要包含大写字母');
        return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
        showToast('密码需要包含特殊符号');
        return;
    }

    if (!confirmPassword) {
        showToast('请输入确认密码');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('两次密码不一致');
        return;
    }

    addBotMessage('⏳ 正在重置密码...');

    try {
        const response = await fetch('https://api.4kp3l0iq.topuser/password/reset-verified', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                user_id: resetData.userId,
                username: resetData.username,
                new_password: newPassword,
                verify_method: 'face_idcard',
                id_card: resetData.idCard
            })
        });

        const data = await response.json();

        if (data.code === 1 || data.code === 200) {
            addBotMessage(`✅ 密码重置成功！

• 账号：${resetData.username}

• 新密码已生效

请使用新密码登录。3秒后自动跳转登录页面...`);

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

        } else {
            addBotMessage(`❌ 密码重置失败

${data.msg || '未知错误'}

请重试或联系客服。`);
        }

    } catch (error) {
        console.error('密码重置错误:', error);
        addBotMessage('❌ 网络错误，请重试');
    }
}

/**
 * 添加Bot消息到聊天窗口
 */
function addBotMessage(content, isHtml = false) {
    // 这个函数会在messages.html中实现
    if (typeof window.addMessageToChat === 'function') {
        window.addMessageToChat('bot', content, isHtml);
    }
}

/**
 * Toast提示
 */
function showToast(message) {
    const toast = document.createElement('div');
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
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { document.body.removeChild(toast); }, 1500);
}

// 导出函数
if (typeof window !== 'undefined') {
    window.startPasswordResetFlow = startPasswordResetFlow;
    window.handleAccountChoice = handleAccountChoice;
    window.showIdCardForm = showIdCardForm;
    window.submitIdCardInfo = submitIdCardInfo;
    window.submitNewPassword = submitNewPassword;
    window.initAIFaceCamera = initAIFaceCamera;
    window.captureAIFace = captureAIFace;
}
