/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 全局用户数据缓存Store
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能：
 * 1. 全局单例模式存储用户数据
 * 2. 持久化到 sessionStorage（会话期间有效）
 * 3. 自动过期机制（5分钟）
 * 4. 事件通知机制
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const ProvidenceUserStore = (function() {
    'use strict';

    // 配置
    const CONFIG = {
        STORAGE_KEY: 'providence_user_cache',
        CACHE_DURATION: 5 * 60 * 1000, // 5分钟
        DEBUG: true
    };

    // 私有状态
    let state = {
        userData: null,
        lastUpdated: null,
        isLoading: false,
        listeners: []
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 日志函数
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('%c[UserStore]', 'color: #4ade80; font-weight: bold', ...args);
        }
    }

    function logError(...args) {
        console.error('%c[UserStore]', 'color: #f87171; font-weight: bold', ...args);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 持久化存储
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function saveToStorage() {
        try {
            if (!state.userData) return;

            const cacheData = {
                userData: state.userData,
                lastUpdated: state.lastUpdated,
                timestamp: Date.now()
            };

            sessionStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cacheData));
            log('数据已保存到 sessionStorage');
        } catch (error) {
            logError('保存失败:', error);
        }
    }

    function loadFromStorage() {
        try {
            const cached = sessionStorage.getItem(CONFIG.STORAGE_KEY);
            if (!cached) {
                log('无缓存数据');
                return null;
            }

            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            if (age > CONFIG.CACHE_DURATION) {
                log('缓存已过期 (', (age / 1000).toFixed(0), '秒)');
                sessionStorage.removeItem(CONFIG.STORAGE_KEY);
                return null;
            }

            log('从缓存加载数据 (', (age / 1000).toFixed(0), '秒前)');
            return cacheData;
        } catch (error) {
            logError('加载失败:', error);
            return null;
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 事件系统
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function notifyListeners(event, data) {
        state.listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                logError('监听器错误:', error);
            }
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 公开API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    return {
        /**
         * 初始化Store（从缓存加载）
         */
        init() {
            log('初始化...');
            const cached = loadFromStorage();
            if (cached) {
                state.userData = cached.userData;
                state.lastUpdated = cached.lastUpdated;
                log('初始化完成，已加载缓存数据');
            } else {
                log('初始化完成，无缓存数据');
            }
        },

        /**
         * 获取用户数据（同步）
         * @returns {Object|null} 用户数据或null
         */
        getUserData() {
            return state.userData;
        },

        /**
         * 设置用户数据
         * @param {Object} userData - 用户数据
         */
        setUserData(userData) {
            if (!userData) {
                logError('尝试设置空数据');
                return;
            }

            state.userData = userData;
            state.lastUpdated = Date.now();
            saveToStorage();
            notifyListeners('update', userData);

            log('用户数据已更新:', {
                username: userData.username,
                balance_cny: userData.balance_cny,
                balance_usdt: userData.balance_usdt,
                vip_level: userData.vip_level
            });
        },

        /**
         * 更新部分字段
         * @param {Object} updates - 要更新的字段
         */
        updateFields(updates) {
            if (!state.userData) {
                logError('无数据可更新');
                return;
            }

            Object.assign(state.userData, updates);
            state.lastUpdated = Date.now();
            saveToStorage();
            notifyListeners('update', state.userData);

            log('字段已更新:', updates);
        },

        /**
         * 清除数据
         */
        clear() {
            state.userData = null;
            state.lastUpdated = null;
            sessionStorage.removeItem(CONFIG.STORAGE_KEY);
            notifyListeners('clear', null);
            log('数据已清除');
        },

        /**
         * 检查缓存是否有效
         * @returns {boolean}
         */
        isValid() {
            if (!state.userData || !state.lastUpdated) {
                return false;
            }

            const age = Date.now() - state.lastUpdated;
            return age < CONFIG.CACHE_DURATION;
        },

        /**
         * 获取缓存年龄（秒）
         * @returns {number}
         */
        getCacheAge() {
            if (!state.lastUpdated) return Infinity;
            return (Date.now() - state.lastUpdated) / 1000;
        },

        /**
         * 设置加载状态
         * @param {boolean} loading
         */
        setLoading(loading) {
            state.isLoading = loading;
            notifyListeners('loading', loading);
        },

        /**
         * 获取加载状态
         * @returns {boolean}
         */
        isLoading() {
            return state.isLoading;
        },

        /**
         * 添加监听器
         * @param {Function} callback - 回调函数 (event, data) => void
         */
        subscribe(callback) {
            if (typeof callback !== 'function') {
                logError('监听器必须是函数');
                return;
            }

            state.listeners.push(callback);
            log('已添加监听器');

            // 返回取消订阅函数
            return () => {
                const index = state.listeners.indexOf(callback);
                if (index > -1) {
                    state.listeners.splice(index, 1);
                    log('已移除监听器');
                }
            };
        },

        /**
         * 获取指定字段
         * @param {string} key - 字段名
         * @returns {any}
         */
        get(key) {
            return state.userData ? state.userData[key] : null;
        },

        /**
         * 获取格式化的余额
         * @returns {Object}
         */
        getBalances() {
            if (!state.userData) {
                return {
                    cny: 0,
                    usdt: 0,
                    total_income_cny: 0,
                    total_income_usdt: 0
                };
            }

            return {
                cny: parseFloat(state.userData.balance_cny || 0),
                usdt: parseFloat(state.userData.balance_usdt || 0),
                total_income_cny: parseFloat(state.userData.total_income_cny || 0),
                total_income_usdt: parseFloat(state.userData.total_income_usdt || 0)
            };
        },

        /**
         * 获取用户基本信息
         * @returns {Object}
         */
        getBasicInfo() {
            if (!state.userData) {
                return {
                    username: '加载中...',
                    realname: '',
                    vip_level: 1,
                    invite_code: ''
                };
            }

            return {
                username: state.userData.username || '用户',
                realname: state.userData.realname || '',
                vip_level: parseInt(state.userData.vip_level || 1),
                invite_code: state.userData.invite_code || ''
            };
        },

        /**
         * 调试信息
         */
        debug() {
            console.group('%c[UserStore] 调试信息', 'color: #60a5fa; font-weight: bold');
            console.log('缓存年龄:', this.getCacheAge().toFixed(1), '秒');
            console.log('缓存有效:', this.isValid());
            console.log('正在加载:', state.isLoading);
            console.log('监听器数量:', state.listeners.length);
            console.log('用户数据:', state.userData);
            console.groupEnd();
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 自动初始化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProvidenceUserStore.init();
    });
} else {
    ProvidenceUserStore.init();
}

// 暴露到全局
window.ProvidenceUserStore = ProvidenceUserStore;

console.log('%c[UserStore] 全局用户缓存Store已加载', 'color: #4ade80; font-weight: bold');
