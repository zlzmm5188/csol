/**
 * Providence 邀请分享页面
 * 版本: 2.0.0 (统一对接后端接口)
 * 日期: 2025-11-23
 */

// ===================================
// 页面初始化
// ===================================
(function() {
    'use strict';

    console.log('[邀请分享] 页面脚本加载完成');

    // ===================================
    // 数据存储
    // ===================================
    const pageData = {
        userInfo: null,
        teamStats: null,
        vipConfig: null,
        shareLink: null
    };

    // ===================================
    // 工具函数
    // ===================================
    const utils = {
        /**
         * 格式化金额
         */
        formatMoney(amount) {
            if (!amount || amount === 0) return '0';

            const num = parseFloat(amount);
            if (num >= 100000000) {
                return (num / 100000000).toFixed(1) + '亿';
            }
            if (num >= 10000) {
                return (num / 10000).toFixed(1) + '万';
            }
            return num.toFixed(2);
        },

        /**
         * 生成分享链接
         */
        generateShareLink(inviteCode) {
            if (!inviteCode) {
                console.warn('[工具] 邀请码为空，无法生成链接');
                return null;
            }

            const domain = window.location.hostname;
            let mainDomain = domain;

            // 处理域名
            if (domain.includes('4kp3l0iq.top')) {
                mainDomain = '4kp3l0iq.top';
            } else if (domain === 'localhost' || domain === '127.0.0.1') {
                // 本地测试环境
                mainDomain = '4kp3l0iq.top';
            } else if (domain.includes('.')) {
                const parts = domain.split('.');
                mainDomain = parts.slice(-2).join('.');
            } else {
                // 默认使用主域名
                mainDomain = '4kp3l0iq.top';
            }

            // 确保邀请码是字符串
            const code = String(inviteCode).toLowerCase();
            const link = `https://${code}.${mainDomain}`;

            console.log('[工具] 生成分享链接:', { inviteCode, mainDomain, link });
            return link;
        },

        /**
         * 复制文本到剪贴板
         */
        async copyToClipboard(text) {
            if (!text) {
                await showToast('提示', '无内容可复制');
                return false;
            }

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    await showToast('成功', '复制成功');
                    return true;
                } else {
                    return await this.fallbackCopy(text);
                }
            } catch (error) {
                console.error('[复制] 失败:', error);
                return await this.fallbackCopy(text);
            }
        },

        /**
         * 备用复制方案
         */
        async fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.top = '0';
            textarea.style.left = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);

                if (successful) {
                    await showToast('成功', '复制成功');
                    return true;
                } else {
                    await showToast('错误', '复制失败，请手动复制');
                    return false;
                }
            } catch (err) {
                document.body.removeChild(textarea);
                console.error('[备用复制] 失败:', err);
                await showToast('错误', '复制失败，请手动复制');
                return false;
            }
        }
    };

    // ===================================
    // API 调用
    // ===================================
    const api = {
        /**
         * 获取用户信息（包含邀请码）
         */
        async getUserInfo() {
            try {
                console.log('[API] 获取用户信息...');
                const response = await ApiClient.get('/api/user/info');

                if (response && response.code === 1 && response.data) {
                    console.log('[API] ✅ 用户信息获取成功:', response.data);
                    return response.data;
                }

                throw new Error(response?.msg || '获取用户信息失败');
            } catch (error) {
                console.error('[API] ❌ 获取用户信息失败:', error);
                throw error;
            }
        },

        /**
         * 获取团队成员列表
         */
        async getTeamMembers(level = 0, page = 1, limit = 100) {
            try {
                console.log('[API] 获取团队成员...');
                const response = await ApiClient.get('/team/members', {
                    params: { level, page, limit }
                });

                if (response && response.code === 1 && response.data) {
                    console.log('[API] ✅ 团队成员获取成功:', response.data);
                    return response.data;
                }

                throw new Error(response?.msg || '获取团队成员失败');
            } catch (error) {
                console.error('[API] ❌ 获取团队成员失败:', error);
                return { total: 0, list: [] };
            }
        },

        /**
         * 获取团队奖励信息
         */
        async getTeamRewardInfo() {
            try {
                console.log('[API] 获取团队奖励信息...');
                const response = await ApiClient.get('/team/reward-info');

                if (response && response.code === 1 && response.data) {
                    console.log('[API] ✅ 团队奖励信息获取成功:', response.data);
                    return response.data;
                }

                throw new Error(response?.msg || '获取团队奖励信息失败');
            } catch (error) {
                console.error('[API] ❌ 获取团队奖励信息失败:', error);
                return null;
            }
        }
    };

    // ===================================
    // UI 更新
    // ===================================
    const ui = {
        /**
         * 更新分享链接
         */
        updateShareLink(inviteCode) {
            const linkEl = document.getElementById('shareLink');
            if (!linkEl) {
                console.error('[UI] shareLink 元素未找到');
                return;
            }

            console.log('[UI] 更新分享链接，邀请码:', inviteCode);

            if (!inviteCode) {
                linkEl.innerHTML = '<span style="color:rgba(246,210,122,0.6);">未找到邀请码</span>';
                return;
            }

            const shareLink = utils.generateShareLink(inviteCode);
            if (shareLink) {
                linkEl.textContent = shareLink;
                pageData.shareLink = shareLink;
                console.log('[UI] ✅ 分享链接已更新:', shareLink);
            } else {
                linkEl.innerHTML = '<span style="color:rgba(246,210,122,0.6);">链接生成失败</span>';
                console.error('[UI] ❌ 链接生成失败');
            }
        },

        /**
         * 更新用户VIP等级
         */
        updateVipLevel(vipLevel) {
            const vipEl = document.getElementById('vipLevel');
            if (vipEl) {
                vipEl.textContent = 'VIP' + (vipLevel || 0);
            }
        },

        /**
         * 更新佣金比例（根据VIP等级）
         */
        updateCommission(vipLevel) {
            // VIP等级对应的返利比例
            const commissionRates = {
                0: { l1: 1, l2: 0 },
                1: { l1: 2, l2: 1 },
                2: { l1: 3, l2: 1.5 },
                3: { l1: 4, l2: 2 },
                4: { l1: 4.5, l2: 2.5 },
                5: { l1: 5, l2: 3 },
                6: { l1: 6, l2: 4 },
                7: { l1: 6.5, l2: 4.5 },
                8: { l1: 7, l2: 5 }
            };

            const rates = commissionRates[vipLevel] || commissionRates[0];

            const comm1El = document.getElementById('commission1');
            const comm2El = document.getElementById('commission2');

            if (comm1El) comm1El.textContent = rates.l1 + '%';
            if (comm2El) comm2El.textContent = rates.l2 + '%';
        },

        /**
         * 更新团队统计
         */
        updateTeamStats(teamData) {
            const countEl = document.getElementById('teamCount');
            const investEl = document.getElementById('teamInvest');
            const commissionEl = document.getElementById('myCommission');

            if (!teamData || !teamData.list) {
                if (countEl) countEl.textContent = '0';
                if (investEl) investEl.textContent = '¥0';
                if (commissionEl) commissionEl.textContent = '¥0';
                return;
            }

            const members = teamData.list;
            const totalCount = members.length;
            let totalInvest = 0;
            let totalCommission = 0;

            members.forEach(member => {
                const invest = parseFloat(member.total_invest) || 0;
                totalInvest += invest;
                // 简化计算：一级1%
                totalCommission += invest * 0.01;
            });

            if (countEl) countEl.textContent = totalCount;
            if (investEl) investEl.textContent = '¥' + utils.formatMoney(totalInvest);
            if (commissionEl) commissionEl.textContent = '¥' + utils.formatMoney(totalCommission);
        },

        /**
         * 显示加载状态
         */
        showLoading(containerId, message = '加载中...') {
            const el = document.getElementById(containerId);
            if (el) {
                el.innerHTML = `<span class="loading">${message}</span>`;
            }
        },

        /**
         * 显示错误状态
         */
        showError(containerId, message) {
            const el = document.getElementById(containerId);
            if (el) {
                el.innerHTML = `<span style="color:rgba(246,210,122,0.6);">${message}</span>`;
            }
        }
    };

    // ===================================
    // 折叠功能
    // ===================================
    window.toggleSection = function(card) {
        const isActive = card.classList.contains('active');

        if (isActive) {
            card.classList.remove('active');
        } else {
            // 关闭其他板块
            document.querySelectorAll('.section-card').forEach(c => {
                c.classList.remove('active');
            });
            // 打开当前板块
            card.classList.add('active');

            // 如果是团队管理奖金，渲染表格
            const sectionIcon = card.querySelector('.section-icon');
            if (sectionIcon && sectionIcon.textContent === '🏆' && !card.dataset.loaded) {
                card.dataset.loaded = 'true';
                renderBonusTable();
            }
        }
    };

    // ===================================
    // 渲染团队管理奖金表格
    // ===================================
    function renderBonusTable() {
        const loading = document.getElementById('loadingBonus');
        const table = document.getElementById('bonusTable');
        const tableBody = document.getElementById('bonusTableBody');
        const tableNote = document.getElementById('bonusNote');

        // 团队管理奖金数据（从memory中获取）
        const bonusData = [
            { members: 3, invest: 80000, bonus: 1800 },
            { members: 5, invest: 150000, bonus: 2500 },
            { members: 10, invest: 500000, bonus: 8800 },
            { members: 20, invest: 1500000, bonus: 18000 },
            { members: 50, invest: 3800000, bonus: 25000 },
            { members: 100, invest: 8800000, bonus: 38000 },
            { members: 200, invest: 15000000, bonus: 66000 },
            { members: 500, invest: 58000000, bonus: 100000 },
            { members: 1000, invest: 98000000, bonus: 180000 }
        ];

        const rows = bonusData.map(item => `
            <tr>
                <td>${item.members}人</td>
                <td>¥${utils.formatMoney(item.invest)}</td>
                <td class="highlight">¥${utils.formatMoney(item.bonus)}</td>
            </tr>
        `).join('');

        if (tableBody) tableBody.innerHTML = rows;
        if (loading) loading.style.display = 'none';
        if (table) table.style.display = 'table';
        if (tableNote) tableNote.style.display = 'block';
    }

    // ===================================
    // 复制分享链接
    // ===================================
    window.copyShareLink = async function() {
        const shareLink = pageData.shareLink || document.getElementById('shareLink')?.textContent;

        if (!shareLink ||
            shareLink.includes('加载中') ||
            shareLink.includes('请先登录') ||
            shareLink.includes('失败') ||
            shareLink.includes('错误')) {
            await showToast('提示', '链接尚未加载，请稍后重试');
            return;
        }

        await utils.copyToClipboard(shareLink);
    };

    // ===================================
    // 页面加载逻辑
    // ===================================
    async function initPage() {
        try {
            console.log('[邀请分享] 开始初始化页面...');

            // 1. 检查登录状态
            if (!TokenManager.hasToken()) {
                ui.showError('shareLink', '请先登录');
                await showToast('提示', '请先登录');
                setTimeout(() => {
                    TokenManager.requireLogin();
                }, 1500);
                return;
            }

            // 2. 获取用户信息
            ui.showLoading('shareLink', '加载中');
            const userInfo = await api.getUserInfo();
            pageData.userInfo = userInfo;

            // 3. 更新分享链接
            const inviteCode = userInfo.invite_code || userInfo.user_id || userInfo.uid || userInfo.id;
            console.log('[初始化] 邀请码:', inviteCode, '用户信息:', userInfo);
            ui.updateShareLink(inviteCode);

            // 4. 更新VIP等级
            ui.updateVipLevel(userInfo.vip_level);

            // 5. 更新佣金比例
            ui.updateCommission(userInfo.vip_level);

            // 6. 获取团队数据
            const teamData = await api.getTeamMembers();
            pageData.teamStats = teamData;
            ui.updateTeamStats(teamData);

            console.log('[邀请分享] ✅ 页面初始化完成');

        } catch (error) {
            console.error('[邀请分享] ❌ 初始化失败:', error);
            ui.showError('shareLink', '加载失败，请刷新重试');
            await showToast('错误', error.message || '网络错误，请稍后重试');
        }
    }

    // ===================================
    // 页面加载完成后执行
    // ===================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

})();
