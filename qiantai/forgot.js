// 找回密码 - 统一使用config.js的API封装
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

const AREA_CODE = '86';

let fgCountdown = 0;

// 发送验证码
async function sendFgSms(){
    var account = document.getElementById('fgAccount').value.trim();
    if(!account){ return showToast('请输入账号或手机号'); }

    if(fgCountdown>0){ return showToast('请稍后再试'); }

    // 判断是手机号还是账号
    const isMobile = /^1[3-9]\d{9}$/.test(account);

    if(isMobile){
        // 手机号找回密码
        try{
            await waitForAPI();
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const res = await fetch(API_BASE + '/login/sms/forget',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    area: parseInt(AREA_CODE,10),
                    mobile: AREA_CODE + account,
                    mobile2: account
                })
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('解析响应失败:', text.substring(0, 100));
                showToast('网络错误，请重试');
                return;
            }
            if(data.code === 200 || data.code === 1 || data.msg === '发送成功'){
                showToast('验证码已发送');
                startFgCountdown();
            }else{
                showToast(data.msg || '发送失败');
            }
        }catch(e){
            console.error(e);
            showToast('网络错误，请重试');
        }
    }else{
        // 账号找回密码（目前后端可能不支持，显示提示）
        showToast('账号找回密码功能暂不支持，请使用手机号找回');
        // 或者调用账号找回接口（如果后端已实现）
        // const res = await fetch(API_BASE + '/login/sms/forget/account', {...});
    }
}

function startFgCountdown(){
    fgCountdown = 60;
    const btn = document.getElementById('btnSendFgSms');
    const timer = setInterval(()=>{
        fgCountdown--;
        btn.textContent = fgCountdown + '秒后重试';
        if(fgCountdown<=0){
            clearInterval(timer);
            btn.textContent = '获取验证码';
        }
    },1000);
}

// 重置密码
async function handleReset(){
    var account = document.getElementById('fgAccount').value.trim();
    var code = document.getElementById('fgCode').value.trim();
    var password = document.getElementById('fgPassword').value.trim();

    if(!account){ return showToast('请输入账号或手机号'); }
    if(!code){ return showToast('请输入验证码'); }

    // 验证新密码格式
    if(!password){ return showToast('请输入新密码'); }
    if(password.length < 8){ return showToast('密码至少需要8位'); }
    if(!/[a-z]/.test(password)){ return showToast('密码需要包含小写字母'); }
    if(!/[A-Z]/.test(password)){ return showToast('密码需要包含大写字母'); }
    if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)){
        return showToast('密码需要包含至少一位特殊符号');
    }

    // 判断是手机号还是账号
    const isMobile = /^1[3-9]\d{9}$/.test(account);

    if(isMobile){
        // 手机号重置密码
        try{
            await waitForAPI();
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const res = await fetch(API_BASE + '/user/user/resetPassword',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    area: parseInt(AREA_CODE,10),
                    mobile: AREA_CODE + account,
                    password: password,
                    sms: code
                })
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('解析响应失败:', text.substring(0, 100));
                showToast('网络错误，请重试');
                return;
            }
            if(data.code === 200 || data.msg === '找回成功'){
                showToast('重置成功，请登录');
                setTimeout(()=>{ window.location.href='login.html'; },1000);
            }else{
                showToast(data.msg || '重置失败');
            }
        }catch(e){
            console.error(e);
            showToast('网络错误，请重试');
        }
    }else{
        // 账号重置密码（暂不支持）
        showToast('账号找回密码功能开发中，请使用手机号');
    }
}

function showToast(message){
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
    `;
    document.body.appendChild(toast);
    setTimeout(()=>{
        document.body.removeChild(toast);
    },3000);
}
