/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 新人红包领取系统
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        REDPACKET_AMOUNT: 88, // 红包金额
        REDPACKET_TYPE: 'USDT', // 红包类型
        API_ENDPOINT: '/index.php/user/newbie-gift', // API端点
        DEBUG: true
    };

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('%c[RedPacket]', 'color: #ff4d4f; font-weight: bold', ...args);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 创建红包弹窗
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function createRedPacketModal() {
        const modal = document.createElement('div');
        modal.id = 'newbieRedPacketModal';
        modal.className = 'redpacket-modal';
        modal.innerHTML = `
            <div class="redpacket-overlay"></div>
            <div class="redpacket-container">
                <!-- 红包顶部装饰 -->
                <div class="redpacket-top-decoration"></div>

                <!-- 红包主体 -->
                <div class="redpacket-body">
                    <!-- 关闭按钮 -->
                    <button class="redpacket-close" onclick="window.closeNewbieRedPacket()">×</button>

                    <!-- 红包图标 -->
                    <div class="redpacket-icon-wrapper">
                        <div class="redpacket-icon">🧧</div>
                        <div class="redpacket-glow"></div>
                    </div>

                    <!-- 标题 -->
                    <div class="redpacket-title">新人专属体验金</div>
                    <div class="redpacket-subtitle">恭喜您获得新人红包</div>

                    <!-- 金额显示 -->
                    <div class="redpacket-amount-wrapper">
                        <div class="redpacket-amount">
                            <span class="amount-value">${CONFIG.REDPACKET_AMOUNT}</span>
                            <span class="amount-currency">${CONFIG.REDPACKET_TYPE}</span>
                        </div>
                    </div>

                    <!-- 说明 -->
                    <div class="redpacket-desc">
                        <p>🎁 首次注册专享</p>
                        <p>💰 可用于投资理财项目</p>
                        <p>📈 享受真实收益分红</p>
                    </div>

                    <!-- 领取按钮 -->
                    <button class="redpacket-claim-btn" onclick="window.claimNewbieRedPacket()">
                        <span class="btn-text">立即领取</span>
                        <span class="btn-shine"></span>
                    </button>

                    <!-- 底部提示 -->
                    <div class="redpacket-footer">
                        点击领取即同意《新手体验金使用规则》
                    </div>
                </div>

                <!-- 红包底部装饰 -->
                <div class="redpacket-bottom-decoration"></div>

                <!-- 飘落金币动画 -->
                <div class="coins-animation"></div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 显示红包弹窗
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function showRedPacket() {
        log('显示红包弹窗');

        let modal = document.getElementById('newbieRedPacketModal');
        if (!modal) {
            modal = createRedPacketModal();
        }

        // 显示弹窗
        modal.style.display = 'flex';

        // 添加显示动画
        requestAnimationFrame(() => {
            modal.classList.add('show');
            startCoinsAnimation();
        });

        // 禁止页面滚动
        document.body.style.overflow = 'hidden';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 关闭红包弹窗
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function closeRedPacket() {
        log('关闭红包弹窗');

        const modal = document.getElementById('newbieRedPacketModal');
        if (!modal) return;

        modal.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 领取红包
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function claimRedPacket() {
        log('领取红包');

        const btn = document.querySelector('.redpacket-claim-btn');
        if (!btn) return;

        // 禁用按钮
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-text">领取中...</span>';

        try {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const token = localStorage.getItem('providence_token');

            if (!token) {
                throw new Error('请先登录');
            }

            const response = await fetch(API_BASE + CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token,
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'newbie_gift'
                })
            });

            const data = await response.json();

            if ((data.code === 1 || data.code === 200) && data.success !== false) {
                // 领取成功
                log('领取成功', data);

                btn.innerHTML = '<span class="btn-text">✅ 领取成功！</span>';
                btn.style.background = 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)';

                // 显示成功提示
                if (typeof showToast === 'function') {
                    showToast(`🎉 恭喜您获得${CONFIG.REDPACKET_AMOUNT} ${CONFIG.REDPACKET_TYPE}新人体验金！`);
                }

                // 2秒后关闭
                setTimeout(() => {
                    closeRedPacket();

                    // 刷新余额
                    if (window.ProvidenceProfile && window.ProvidenceProfile.refresh) {
                        window.ProvidenceProfile.refresh(true);
                    }
                }, 2000);

            } else {
                // 领取失败
                throw new Error(data.msg || data.message || '领取失败');
            }

        } catch (error) {
            log('领取失败', error);

            btn.disabled = false;
            btn.innerHTML = '<span class="btn-text">立即领取</span>';

            const message = error.message || '领取失败，请稍后重试';

            if (typeof showToast === 'function') {
                showToast(message);
            } else {
                alert(message);
            }
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 金币飘落动画
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function startCoinsAnimation() {
        const container = document.querySelector('.coins-animation');
        if (!container) return;

        container.innerHTML = '';

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'coin';
                coin.textContent = '💰';
                coin.style.left = Math.random() * 100 + '%';
                coin.style.animationDuration = (2 + Math.random() * 2) + 's';
                coin.style.animationDelay = Math.random() * 0.5 + 's';
                container.appendChild(coin);

                setTimeout(() => coin.remove(), 4000);
            }, i * 200);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 暴露到全局
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    window.showNewbieRedPacket = showRedPacket;
    window.closeNewbieRedPacket = closeRedPacket;
    window.claimNewbieRedPacket = claimRedPacket;

    log('新人红包系统已加载');

})();
