/**
 * 邀请链接自动跳转逻辑
 * 功能：检测子域名 → 提取邀请码 → 保存到localStorage → 跳转到注册页
 */

(function() {
    // 只在首页执行
    if (window.location.pathname !== '/') return;

    try {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        // 检测子域名（排除主域名和www）
        if (parts.length === 3 && parts[0] !== 'www') {
            const inviteCode = parts[0]; // 提取邀请码（可能是UID或invite_code）

            console.log('[邀请] 检测到邀请链接，邀请码:', inviteCode);

            // 保存邀请码到localStorage（注册页会自动读取）
            localStorage.setItem('invite_code_from_link', inviteCode);
            localStorage.setItem('invite_timestamp', Date.now());

            // 立即跳转到注册页
            console.log('[邀请] 正在跳转到注册页...');
            window.location.href = '/register.html';
        } else {
            console.log('[邀请] 主域名访问，无需跳转');
        }
    } catch (e) {
        console.error('[邀请] 自动跳转失败:', e);
    }
})();
