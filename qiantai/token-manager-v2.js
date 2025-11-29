/**
 * Token管理模块 - 统一处理Token存储和验证
 * 依赖: 无
 * 提供: TokenManager 对象
 */

(function() {
    'use strict';

    window.TokenManager = {
        // Token存储键
        TOKEN_KEY: 'providence_token',
        USER_KEY: 'providence_user_id',
        USERNAME_KEY: 'providence_user_name',
        
        /**
         * 保存Token (双存储: localStorage + sessionStorage)
         */
        saveToken: function(token) {
            if (!token) {
                console.warn('[TokenManager] Token为空');
                return false;
            }
            
            try {
                localStorage.setItem(this.TOKEN_KEY, token);
                sessionStorage.setItem(this.TOKEN_KEY, token);
                console.log('[TokenManager] Token已保存');
                return true;
            } catch (e) {
                console.error('[TokenManager] 保存Token失败:', e);
                return false;
            }
        },
        
        /**
         * 获取Token
         */
        getToken: function() {
            try {
                return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
            } catch (e) {
                console.error('[TokenManager] 获取Token失败:', e);
                return null;
            }
        },
        
        /**
         * 清除Token
         */
        clearToken: function() {
            try {
                localStorage.removeItem(this.TOKEN_KEY);
                sessionStorage.removeItem(this.TOKEN_KEY);
                localStorage.removeItem(this.USER_KEY);
                localStorage.removeItem(this.USERNAME_KEY);
                console.log('[TokenManager] Token已清除');
                return true;
            } catch (e) {
                console.error('[TokenManager] 清除Token失败:', e);
                return false;
            }
        },
        
        /**
         * 检查Token是否存在
         */
        hasToken: function() {
            return !!this.getToken();
        },
        
        /**
         * 获取用户ID
         */
        getUserId: function() {
            try {
                return localStorage.getItem(this.USER_KEY);
            } catch (e) {
                return null;
            }
        },
        
        /**
         * 保存用户ID
         */
        saveUserId: function(userId) {
            try {
                localStorage.setItem(this.USER_KEY, userId);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * 获取用户名
         */
        getUsername: function() {
            try {
                return localStorage.getItem(this.USERNAME_KEY);
            } catch (e) {
                return null;
            }
        },
        
        /**
         * 保存用户名
         */
        saveUsername: function(username) {
            try {
                localStorage.setItem(this.USERNAME_KEY, username);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * 设置请求头中的Authorization
         */
        setAuthHeader: function(xhr) {
            const token = this.getToken();
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                xhr.setRequestHeader('token', token);
            }
        },
        
        /**
         * 检查是否已登录
         */
        isLoggedIn: function() {
            return this.hasToken();
        },
        
        /**
         * 登出
         */
        logout: function() {
            this.clearToken();
            // 跳转到登录页
            window.location.href = '/login.html';
        }
    };
    
    console.log('[TokenManager] 模块已加载');
})();
