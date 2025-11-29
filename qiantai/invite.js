/**
 * 我的团队页面 - 优化版
 * 修复：团队人数统计问题
 * 新增：有效下级筛选（实名+充值+持仓）
 * updated 2025-11-08
 */
import { apiRequest, formatMoney, getToken, redirectToLogin, showToast } from './api-utils.js';

let userData = {
    currentLevel: 1,
    currentPid: 0,
    inviteCode: '',
    inviteLink: '',
    commissionRates: {l1: '', l2: ''},
    teamData: {
        level1: [],      // 一级团队（直推）
        level2: []       // 二级团队（下级的下级）
    },
    allLevel2: []        // 所有二级成员（用于统计）
};

document.addEventListener('DOMContentLoaded', function() {
    initPage();
});

async function initPage() {
    if (!getToken()) {
        showToast('请先登录');
        setTimeout(() => redirectToLogin(), 1500);
        return;
    }

    bindEvents();
    await loadInviteInfo();
    await loadAllTeamData(); // 一次性加载所有团队数据
}

// 加载邀请信息
async function loadInviteInfo() {
    try {
        // 正确的API路径：使用 /api/user/info 获取邀请信息
        const data = await apiRequest('/api/user/info', {}, 'GET');

        if (data.data) {
            userData.inviteCode = data.data.invite || data.data.uid || '';
            userData.inviteLink = window.location.origin + '/register.html?code=' + userData.inviteCode;
            userData.commissionRates.l1 = data.data.l1 || '1%';
            userData.commissionRates.l2 = data.data.l2 || '0.5%';
        }
    } catch (error) {
        console.error('加载邀请信息失败:', error);
        if (error.message.includes('登录')) {
            setTimeout(() => redirectToLogin(), 1500);
        }
    }
}

function bindEvents() {
    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            switchLevel(level);
        });
    });
}

/**
 * 一次性加载所有团队数据
 */
async function loadAllTeamData() {
    const container = document.getElementById('teamList');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">加载中...</div>
        </div>
    `;

    try {
        // 1. 先加载一级团队（直推）
        const level1Data = await apiRequest('/api/team/members', {
            page: 1,
            level: 1
        }, 'GET');

        if (level1Data.data && level1Data.data.users) {
            userData.teamData.level1 = level1Data.data.users;
            console.log('[团队] 一级团队加载成功:', userData.teamData.level1.length, '人');

            // 2. 然后加载所有一级成员的下级（二级团队）
            const level2Members = [];
            for (const member of userData.teamData.level1) {
                try {
                    const level2Data = await apiRequest('/api/team/members', {
                        page: 1,
                        level: 2
                    }, 'GET');

                    if (level2Data.data && level2Data.data.users) {
                        level2Members.push(...level2Data.data.users);
                    }
                } catch (err) {
                    console.warn('[团队] 加载成员', member.id, '的下级失败:', err);
                }
            }

            // 去重（使用Map，key为member.id）
            const uniqueLevel2 = new Map();
            level2Members.forEach(m => {
                if (!uniqueLevel2.has(m.id)) {
                    uniqueLevel2.set(m.id, m);
                }
            });

            userData.allLevel2 = Array.from(uniqueLevel2.values());
            console.log('[团队] 二级团队加载成功:', userData.allLevel2.length, '人');

            // 3. 初始显示一级团队
            renderTeamList(1);
            updateStats();
        } else {
            showEmpty('暂无团队成员');
        }
    } catch (error) {
        console.error('加载团队数据失败:', error);

        if (error.message.includes('登录')) {
            showEmpty('⚠️ 请先登录后查看团队数据');
            const container = document.getElementById('teamList');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔐</div>
                        <div class="empty-text">请先登录后查看团队数据</div>
                        <button onclick="window.location.href='login.html'" style="margin-top:20px;padding:12px 32px;background:linear-gradient(135deg, #d4af37, #f4d03f);color:#0e2b44;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:700;box-shadow:0 4px 12px rgba(212,175,55,0.3);">立即登录</button>
                    </div>
                `;
            }
        } else {
            showEmpty('加载失败，请点击重试');
        }
    }
}

/**
 * 加载特定成员的下级
 */
async function loadMemberSubTeam(memberId) {
    try {
        const data = await apiRequest('/api/team/members', {
            page: 1,
            level: 2
        }, 'GET');

        if (data.data && data.data.users) {
            userData.teamData.level2 = data.data.users;
            renderTeamList(2);
        } else {
            showEmpty('该成员暂无下级');
        }
    } catch (error) {
        console.error('加载下级失败:', error);
        showEmpty('加载失败，请重试');
    }
}

function switchLevel(level) {
    userData.currentLevel = level;

    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.classList.remove('active');
        if (parseInt(tab.dataset.level) === level) {
            tab.classList.add('active');
        }
    });

    // 切换到一级时，重置currentPid并显示所有一级成员
    if (level === 1) {
        userData.currentPid = 0;
        userData.teamData.level2 = []; // 清空二级显示数据
        renderTeamList(1);
    } else {
        // 切换到二级时，显示所有二级成员
        userData.teamData.level2 = userData.allLevel2;
        renderTeamList(2);
    }
}

/**
 * 判断是否为有效下级
 * 条件：实名认证 + 充值 + 有持仓
 */
function isValidMember(member) {
    // 1. 实名认证检查
    const isKycVerified = member.kyc_status === 2 ||
                         member.kyc_status === '2' ||
                         member.isKycVerified === true ||
                         (member.realname && member.realname !== '');

    // 2. 充值检查
    const recharges = parseFloat(member.recharges) || 0;
    const hasRecharged = recharges > 0;

    // 3. 持仓检查
    const withdraws = parseFloat(member.withdraws) || 0;
    const currentHolding = recharges - withdraws;
    const hasHolding = currentHolding > 0;

    return isKycVerified && hasRecharged && hasHolding;
}

function renderTeamList(level) {
    const container = document.getElementById('teamList');
    if (!container) return;

    const members = level === 1 ? userData.teamData.level1 : userData.teamData.level2;

    if (members.length === 0) {
        showEmpty('暂无团队成员');
        return;
    }

    // 筛选有效成员
    const validMembers = members.filter(m => isValidMember(m));
    const invalidMembers = members.filter(m => !isValidMember(m));

    // 先显示有效成员，再显示无效成员（置灰）
    const allMembers = [...validMembers, ...invalidMembers];

    const membersHtml = allMembers.map(member => {
        const recharges = parseFloat(member.recharges) || 0;
        const withdraws = parseFloat(member.withdraws) || 0;
        const currentHolding = recharges - withdraws;
        const isValid = isValidMember(member);

        return `
            <div class="team-member-card ${!isValid ? 'invalid-member' : ''}">
                <div class="member-header">
                    <div class="member-avatar">${getAvatar(member.realname || member.id)}</div>
                    <div class="member-info">
                        <div class="member-name">
                            ${member.realname || '用户' + member.id}
                            ${!isValid ? '<span class="invalid-badge">未激活</span>' : ''}
                        </div>
                        <div class="member-id">ID: ${member.id}</div>
                    </div>
                    ${member.level > 0 ? `<div class="member-vip">VIP${member.level}</div>` : ''}
                </div>
                <div class="member-stats">
                    <div class="member-stat-item">
                        <div class="stat-label-sm">累计投资</div>
                        <div class="stat-value-sm">¥${formatMoney(recharges)}</div>
                    </div>
                    <div class="stat-divider-sm"></div>
                    <div class="member-stat-item">
                        <div class="stat-label-sm">目前持仓</div>
                        <div class="stat-value-sm stat-value-highlight">¥${formatMoney(currentHolding)}</div>
                    </div>
                    ${level === 1 ? `
                    <div class="stat-divider-sm"></div>
                    <div class="member-stat-item">
                        <button class="btn-view-sub" onclick="viewSubTeam(${member.id})">查看下级</button>
                    </div>
                    ` : ''}
                </div>
                ${!isValid ? `
                <div class="invalid-notice">
                    <span class="notice-icon">ℹ️</span>
                    <span class="notice-text">
                        ${!isValidMember(member) ? '未完成：' : ''}
                        ${!(member.kyc_status === 2) ? '实名认证 ' : ''}
                        ${!(recharges > 0) ? '充值 ' : ''}
                        ${!(currentHolding > 0) ? '持仓 ' : ''}
                    </span>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = membersHtml;

    // 显示有效/无效统计
    if (invalidMembers.length > 0) {
        container.innerHTML += `
            <div class="team-stat-footer">
                <span class="stat-footer-text">
                    ✓ 有效成员 ${validMembers.length}人 ·
                    ⚠️ 待激活 ${invalidMembers.length}人
                </span>
            </div>
        `;
    }
}

window.viewSubTeam = function(memberId) {
    userData.currentPid = memberId;
    userData.currentLevel = 2;

    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.classList.remove('active');
        if (parseInt(tab.dataset.level) === 2) {
            tab.classList.add('active');
        }
    });

    loadMemberSubTeam(memberId);
};

/**
 * 更新统计数据
 * 只统计有效成员
 */
function updateStats() {
    const level1 = userData.teamData.level1;
    const level2 = userData.allLevel2;

    // 筛选有效成员
    const validLevel1 = level1.filter(m => isValidMember(m));
    const validLevel2 = level2.filter(m => isValidMember(m));

    // 总人数（有效成员）
    const totalValidMembers = validLevel1.length + validLevel2.length;
    const totalMembers = level1.length + level2.length;

    // 总投资（只计算有效成员）
    let totalInvestment = 0;
    [...validLevel1, ...validLevel2].forEach(member => {
        totalInvestment += parseFloat(member.recharges) || 0;
    });

    // 佣金（简化计算，实际应从后端获取）
    const myCommission = totalInvestment * 0.01;

    const totalMembersEl = document.getElementById('totalMembers');
    const totalInvestmentEl = document.getElementById('totalInvestment');
    const myCommissionEl = document.getElementById('myCommission');

    if (totalMembersEl) {
        totalMembersEl.innerHTML = `
            <span style="font-size:24px;font-weight:700;">${totalValidMembers}</span>
            <span style="font-size:12px;color:rgba(255,255,255,0.6);margin-left:4px;">/ ${totalMembers}人</span>
        `;
    }
    if (totalInvestmentEl) totalInvestmentEl.textContent = '¥' + formatMoney(totalInvestment);
    if (myCommissionEl) myCommissionEl.textContent = '¥' + formatMoney(myCommission);

    console.log('[团队统计] 总人数:', totalMembers, '有效人数:', totalValidMembers, '总投资:', totalInvestment);
}

function getAvatar(name) {
    if (!name) return '👤';
    const firstChar = String(name).charAt(0).toUpperCase();
    return /[A-Z]/.test(firstChar) ? firstChar : '👤';
}

function showEmpty(message) {
    const container = document.getElementById('teamList');
    if (!container) return;

    const isError = message.includes('失败') || message.includes('错误') || message.includes('重试');

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">${isError ? '⚠️' : '👥'}</div>
            <div class="empty-text">${message}</div>
            ${isError ? '<button onclick="retryLoadTeam()" style="margin-top:20px;padding:10px 24px;background:#d4af37;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">重新加载</button>' : ''}
        </div>
    `;
}

// 重试加载团队数据
window.retryLoadTeam = function() {
    console.log('[团队] 用户点击重试');
    loadAllTeamData();
};
