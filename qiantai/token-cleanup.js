/**
 * Token清理脚本
 * 自动清理旧版本的token，迁移到新格式
 */
(function() {
    try {
        // 检查并清理旧token
        const oldToken = localStorage.getItem('providence_token');
        const newToken = localStorage.getItem('providence_token');
        
        if (oldToken && !newToken) {
            // 如果只有旧token，迁移到新格式
            console.log('[Token清理] 发现旧token，正在迁移...');
            localStorage.setItem('providence_token', oldToken);
            localStorage.removeItem('token');
            console.log('[Token清理] ✅ Token已迁移');
        } else if (oldToken && newToken) {
            // 如果两个都存在，删除旧的
            console.log('[Token清理] 清除重复的旧token');
            localStorage.removeItem('token');
        }
        
        // 清理其他可能的旧key
        const keysToRemove = ['userToken', 'user_token', 'access_token'];
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log('[Token清理] 已清除:', key);
            }
        });
        
    } catch (e) {
        console.error('[Token清理] 清理失败:', e);
    }
})();
