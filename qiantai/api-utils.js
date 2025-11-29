/**
 * Providence 统一 API 配置
 * updated by AI - providence integration 2025-10
 *
 * ⚠️ 已废弃 - 请使用 token-manager.js 中的统一API封装
 *
 * 使用说明：
 * import { apiRequest, API_CONFIG } from './api-utils.js';
 * const data = await apiRequest('/api/user/info', {}, 'GET');
 */

// API 配置
export const API_CONFIG = {
    BASE_URL: 'https://api.4kp3l0iq.top',
    TIMEOUT: 30000,
    RETRY_TIMES: 2
};

/**
 * ⚠️ 已废弃 - 请使用 window.apiRequest() 或 TokenManager 中的方法
 * 统一API请求函数
 * @param {string} endpoint - API端点（如：/api/user/info）
 * @param {object} data - 请求数据
 * @param {string} method - 请求方法（GET/POST）
 * @param {boolean} needAuth - 是否需要token认证
 * @returns {Promise<object>} - 返回解析后的数据
 */
export async function apiRequest(endpoint, data = {}, method = 'GET', needAuth = true) {
    console.warn('[api-utils] 此方法已废弃，请使用 window.apiRequest() (来自token-manager.js)');

    // 兼容处理：调用新的统一API方法
    if (typeof window.apiRequest === 'function') {
        return window.apiRequest(endpoint, {
            method,
            data,
            requireAuth: needAuth
        });
    }

    // 如果token-manager.js未加载，保持旧逻辑
    const url = API_CONFIG.BASE_URL + endpoint;
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    // 添加Token认证
    if (token && needAuth) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Token'] = token;
    }

    const options = {
        method: method,
        headers: headers
    };

    try {
        let finalUrl = url;

        if (method === 'GET' && Object.keys(data).length > 0) {
            const params = new URLSearchParams(data);
            finalUrl = `${url}?${params}`;
        } else if (method === 'POST') {
            options.body = JSON.stringify(data);
        }

// console.log(`[API请求] ${method} ${endpoint}`, data); // 性能优化：已注释

        const response = await fetch(finalUrl, options);
        const text = await response.text();

// console.log(`[API响应] ${endpoint}:`, text.substring(0, 200)); // 性能优化：已注释

        // 检查是否是HTML错误页面
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
            console.error(`[API错误] ${endpoint} 返回HTML错误页面`);
            throw new Error('服务器返回错误页面，请检查API路径是否正确');
        }

        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('[JSON解析失败]:', text);
            throw new Error('服务器返回格式错误，不是有效的JSON');
        }

        return result;
    } catch (error) {
        console.error(`[API错误] ${endpoint}:`, error);
        throw error;
    }
}

/**
 * 显示Toast提示
 * @param {string} message - 提示消息
 * @param {number} duration - 显示时长(ms)
 */
export function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s;
        white-space: nowrap;
        max-width: 80%;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 格式化金额
 * @param {number} value - 金额
 * @returns {string} - 格式化后的金额
 */
export function formatMoney(value) {
    const num = parseFloat(value) || 0;
    if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    }
    return num.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

/**
 * 格式化数字
 * @param {number} value - 数字
 * @returns {string} - 格式化后的数字
 */
export function formatNumber(value) {
    return parseInt(value || 0).toLocaleString('zh-CN');
}

/**
 * 获取Token
 * @returns {string|null} - Token或null
 */
export function getToken() {
    return localStorage.getItem('providence_token') || localStorage.getItem('providence_token') || null;
}

/**
 * 跳转到登录页 - 已禁用
 */
export function redirectToLogin() {
    // clearToken();
    // window.location.href = 'login.html';
    console.warn('[api-utils] redirectToLogin 已禁用，不再跳转');
}

/**
 * 复制到剪贴板
 * @param {string} text - 要复制的文本
 * @param {string} successMsg - 成功提示
 */
export function copyToClipboard(text, successMsg = '复制成功') {
    if (!text) {
        showToast('暂无内容');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(() => {
            fallbackCopy(text, successMsg);
        });
    } else {
        fallbackCopy(text, successMsg);
    }
}

function fallbackCopy(text, successMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast(successMsg);
    } catch (err) {
        showToast('复制失败，请手动复制');
    }
    document.body.removeChild(textarea);
}
