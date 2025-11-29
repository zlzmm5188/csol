/**
 * 登录后体验金领取弹窗
 * 高端大气的设计和文案
 */

const TrialMoneyPopup = {
    // 配置
    config: {
        showOncePerDay: true,  // 每天只显示一次
        storageKey: 'trial_popup_last_shown',
        apiCheckUrl: '/index.php/trial/canClaim'  // 后端检查是否可以领取的接口
    },

    /**
     * 显示弹窗
     */
    show() {
        // 创建弹窗HTML
        const popupHTML = `
        <div class="trial-popup-overlay" id="trialPopupOverlay">
            <div class="trial-popup-container">
                <div class="trial-popup-close" onclick="TrialMoneyPopup.close()">×</div>

                <!-- 顶部装饰 -->
                <div class="trial-popup-decoration">
                    <div class="trial-popup-glow"></div>
                    <div class="trial-popup-logo">
                        <img src="img/logo.png" alt="Providence" onerror="this.style.display='none'">
                    </div>
                </div>

                <!-- 主要内容 -->
                <div class="trial-popup-content">
                    <h2 class="trial-popup-title">
                        <span class="trial-popup-icon">🎁</span>
                        尊贵礼遇
                    </h2>
                    <p class="trial-popup-subtitle">新手专享体验金</p>

                    <div class="trial-popup-amount">
                        <span class="trial-popup-currency">¥</span>
                        <span class="trial-popup-number" id="trialAmount">10,000</span>
                    </div>

                    <div class="trial-popup-features">
                        <div class="trial-popup-feature">
                            <span class="feature-icon">✓</span>
                            <span class="feature-text">零风险体验</span>
                        </div>
                        <div class="trial-popup-feature">
                            <span class="feature-icon">✓</span>
                            <span class="feature-text">真实收益</span>
                        </div>
                        <div class="trial-popup-feature">
                            <span class="feature-icon">✓</span>
                            <span class="feature-text">可提现盈利</span>
                        </div>
                    </div>

                    <p class="trial-popup-desc">
                        尊敬的投资者，感谢您选择 Providence。<br>
                        作为新用户专属礼遇，我们为您准备了体验金，<br>
                        让您零门槛体验专业投资服务的卓越价值。
                    </p>

                    <div class="trial-popup-notice">
                        <span class="notice-icon">ℹ️</span>
                        <span class="notice-text">需完成实名认证后领取</span>
                    </div>

                    <button class="trial-popup-btn" id="trialPopupBtn" onclick="TrialMoneyPopup.handleClaim()">
                        立即领取
                    </button>
                </div>

                <!-- 底部装饰线 -->
                <div class="trial-popup-footer">
                    <div class="trial-popup-divider"></div>
                    <p class="trial-popup-terms">* 体验金收益归您所有，本金需归还平台</p>
                </div>
            </div>
        </div>

        <style>
        .trial-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .trial-popup-container {
            background: linear-gradient(180deg, #0f1f32 0%, #0a1723 100%);
            border: 2px solid rgba(200, 186, 148, 0.3);
            border-radius: 24px;
            max-width: 460px;
            width: 100%;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(30px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .trial-popup-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 24px;
            line-height: 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
        }

        .trial-popup-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }

        .trial-popup-decoration {
            position: relative;
            height: 160px;
            background: linear-gradient(180deg, rgba(200, 186, 148, 0.15) 0%, transparent 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .trial-popup-glow {
            position: absolute;
            top: -50%;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(200, 186, 148, 0.3) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
        }

        .trial-popup-logo {
            position: relative;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #c8ba94, #9e8a57);
            padding: 2px;
            box-shadow: 0 8px 24px rgba(200, 186, 148, 0.4);
        }

        .trial-popup-logo img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: contain;
            padding: 12px;
            background: #0a1723;
        }

        .trial-popup-content {
            padding: 24px 28px 32px;
            text-align: center;
        }

        .trial-popup-title {
            font-size: 26px;
            font-weight: 700;
            color: #c8ba94;
            margin: 0 0 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .trial-popup-icon {
            font-size: 28px;
            animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }

        .trial-popup-subtitle {
            font-size: 15px;
            color: rgba(255, 255, 255, 0.7);
            margin: 0 0 24px;
        }

        .trial-popup-amount {
            background: linear-gradient(135deg, rgba(200, 186, 148, 0.15), rgba(200, 186, 148, 0.08));
            border: 1px solid rgba(200, 186, 148, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
        }

        .trial-popup-currency {
            font-size: 28px;
            color: #c8ba94;
            font-weight: 600;
        }

        .trial-popup-number {
            font-size: 48px;
            font-weight: 700;
            color: #fff;
            letter-spacing: 2px;
        }

        .trial-popup-features {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
        }

        .trial-popup-feature {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.85);
        }

        .feature-icon {
            color: #c8ba94;
            font-weight: 700;
        }

        .trial-popup-desc {
            font-size: 14px;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.75);
            margin: 0 0 20px;
        }

        .trial-popup-notice {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 24px;
        }

        .notice-icon {
            font-size: 16px;
        }

        .notice-text {
            font-size: 13px;
            color: #ffc107;
        }

        .trial-popup-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #efe7d2, #e2d6b5);
            border: 1px solid rgba(158, 138, 87, 0.5);
            border-radius: 12px;
            color: #0b1220;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(200, 186, 148, 0.3);
        }

        .trial-popup-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(200, 186, 148, 0.4);
        }

        .trial-popup-btn:active {
            transform: translateY(0);
        }

        .trial-popup-footer {
            padding: 16px 28px 20px;
            background: rgba(0, 0, 0, 0.2);
        }

        .trial-popup-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(200, 186, 148, 0.3), transparent);
            margin-bottom: 12px;
        }

        .trial-popup-terms {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin: 0;
            text-align: center;
        }

        @media (max-width: 480px) {
            .trial-popup-container {
                border-radius: 20px;
            }
            .trial-popup-title {
                font-size: 24px;
            }
            .trial-popup-number {
                font-size: 42px;
            }
            .trial-popup-features {
                flex-direction: column;
                gap: 12px;
            }
        }
        </style>
        `;

        // 插入到页面
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    },

    /**
     * 关闭弹窗
     */
    close() {
        const overlay = document.getElementById('trialPopupOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    },

    /**
     * 处理领取按钮点击
     */
    handleClaim() {
        // 检查是否已实名认证
        const token = localStorage.getItem('providence_token');
        if (!token) {
            this.close();
            window.location.href = 'login.html';
            return;
        }

        // 检查实名状态并跳转
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        fetch(API_BASE + '/api/user/info', {
            headers: { 'Token': token }
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 200 && data.data) {
                if (data.data.isKycVerified || data.data.kyc_status === 2) {
                    // 已实名，跳转到体验金页面
                    this.close();
                    window.location.href = 'trial-money.html';
                } else {
                    // 未实名，跳转到实名认证页面
                    this.close();
                    window.location.href = 'kyc-verification.html';
                }
            }
        })
        .catch(err => {
            console.error('检查实名状态失败:', err);
            this.close();
            window.location.href = 'trial-money.html';
        });
    },

    /**
     * 检查是否应该显示弹窗
     */
    shouldShow() {
        if (!this.config.showOncePerDay) return true;

        const lastShown = localStorage.getItem(this.config.storageKey);
        if (!lastShown) return true;

        const lastDate = new Date(lastShown);
        const today = new Date();

        return lastDate.toDateString() !== today.toDateString();
    },

    /**
     * 记录弹窗已显示
     */
    markAsShown() {
        localStorage.setItem(this.config.storageKey, new Date().toISOString());
    },

    /**
     * 自动显示（登录后调用）
     */
    autoShow() {
        if (this.shouldShow()) {
            // 延迟1.5秒后显示，给用户缓冲时间
            setTimeout(() => {
                this.show();
                this.markAsShown();
            }, 1500);
        }
    }
};

// 导出到全局
window.TrialMoneyPopup = TrialMoneyPopup;

// 使用示例:
// 1. 登录成功后自动显示:
//    TrialMoneyPopup.autoShow();
//
// 2. 手动显示:
//    TrialMoneyPopup.show();
//
// 3. 关闭弹窗:
//    TrialMoneyPopup.close();
