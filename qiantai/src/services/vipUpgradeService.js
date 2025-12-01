/**
 * VIP Upgrade Workflow Service
 * Handles automatic VIP level upgrades based on cumulative investment
 *
 * Flow:
 * 1. Increase cumulative investment total after each investment
 * 2. Automatically determine highest VIP level qualification
 * 3. If new level exceeds current level, perform automatic upgrade
 * 4. Log the upgrade process
 * 5. Ensure future investments yield upgraded level benefits
 */

const VipUpgradeService = {
  /**
   * VIP Level Configuration
   * Sorted by minimum investment threshold (ascending)
   */
  VIP_LEVELS: [
    {
      level: 0,
      name: 'VIP0',
      minInvest: 0,
      extraRate: 0,
      rebateL1: 1,
      rebateL2: 0,
      dailySignPoints: 6
    },
    {
      level: 1,
      name: 'VIP1',
      minInvest: 30000,
      extraRate: 0.05,
      rebateL1: 2,
      rebateL2: 1,
      dailySignPoints: 10
    },
    {
      level: 2,
      name: 'VIP2',
      minInvest: 100000,
      extraRate: 0.1,
      rebateL1: 3,
      rebateL2: 2,
      dailySignPoints: 16
    },
    {
      level: 3,
      name: 'VIP3',
      minInvest: 250000,
      extraRate: 0.12,
      rebateL1: 4,
      rebateL2: 2,
      dailySignPoints: 20
    },
    {
      level: 4,
      name: 'VIP4',
      minInvest: 800000,
      extraRate: 0.15,
      rebateL1: 5,
      rebateL2: 3,
      dailySignPoints: 30
    },
    {
      level: 5,
      name: 'VIP5',
      minInvest: 1500000,
      extraRate: 0.16,
      rebateL1: 5,
      rebateL2: 4,
      dailySignPoints: 40
    },
    {
      level: 6,
      name: 'VIP6',
      minInvest: 3800000,
      extraRate: 0.18,
      rebateL1: 6,
      rebateL2: 4,
      dailySignPoints: 50
    },
    {
      level: 7,
      name: 'VIP7',
      minInvest: 8000000,
      extraRate: 0.23,
      rebateL1: 6,
      rebateL2: 5,
      dailySignPoints: 60
    },
    {
      level: 8,
      name: 'VIP8',
      minInvest: 13000000,
      extraRate: 0.25,
      rebateL1: 7,
      rebateL2: 5,
      dailySignPoints: 70
    }
  ],

  /**
   * Upgrade log storage key
   */
  UPGRADE_LOG_KEY: 'vip_upgrade_logs',

  /**
   * Get API configuration
   */
  getApiConfig() {
    const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
    const token = window.TokenManager?.getToken?.() ||
      localStorage.getItem('providence_token') || '';
    return { API_BASE, token };
  },

  /**
   * Get user's current VIP information
   * @returns {Promise<Object>} Current VIP info
   */
  async getCurrentVipInfo() {
    const { API_BASE, token } = this.getApiConfig();

    try {
      const response = await fetch(`${API_BASE}/api/user/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Token: token
        }
      });

      const data = await response.json();

      if (data.code === 1 && data.data) {
        const userData = data.data;
        return {
          userId: userData.id || userData.user_id || userData.uid,
          currentLevel: parseInt(userData.vip_level || userData.level || userData.vipLevel || 0),
          cumulativeInvest: parseFloat(userData.cumulative_invest || userData.recharges || 0),
          username: userData.username || userData.phone || '',
          lastUpgradeTime: userData.vip_upgrade_time || null
        };
      }

      throw new Error('获取用户信息失败');
    } catch (err) {
      console.error('[VipUpgrade] Get user info failed:', err);
      throw err;
    }
  },

  /**
   * Determine the highest qualified VIP level based on cumulative investment
   * @param {number} cumulativeInvest - Total cumulative investment
   * @returns {Object} Qualified VIP level configuration
   */
  determineQualifiedLevel(cumulativeInvest) {
    let qualifiedLevel = this.VIP_LEVELS[0];

    // Find the highest level the user qualifies for
    for (let i = this.VIP_LEVELS.length - 1; i >= 0; i--) {
      if (cumulativeInvest >= this.VIP_LEVELS[i].minInvest) {
        qualifiedLevel = this.VIP_LEVELS[i];
        break;
      }
    }

    return { ...qualifiedLevel };
  },

  /**
   * Get the next VIP level requirements
   * @param {number} currentLevel - Current VIP level
   * @returns {Object|null} Next level info or null if at max
   */
  getNextLevelRequirement(currentLevel) {
    if (currentLevel >= this.VIP_LEVELS.length - 1) {
      return null; // Already at max level
    }

    const nextLevel = this.VIP_LEVELS[currentLevel + 1];
    return {
      level: nextLevel.level,
      name: nextLevel.name,
      minInvest: nextLevel.minInvest,
      benefits: {
        extraRate: nextLevel.extraRate,
        rebateL1: nextLevel.rebateL1,
        rebateL2: nextLevel.rebateL2,
        dailySignPoints: nextLevel.dailySignPoints
      }
    };
  },

  /**
   * Calculate upgrade progress
   * @param {number} cumulativeInvest - Current cumulative investment
   * @param {number} currentLevel - Current VIP level
   * @returns {Object} Progress information
   */
  calculateUpgradeProgress(cumulativeInvest, currentLevel) {
    const nextRequirement = this.getNextLevelRequirement(currentLevel);

    if (!nextRequirement) {
      return {
        isMaxLevel: true,
        progress: 100,
        remaining: 0,
        nextLevel: null
      };
    }

    const currentThreshold = this.VIP_LEVELS[currentLevel].minInvest;
    const nextThreshold = nextRequirement.minInvest;
    const rangeTotal = nextThreshold - currentThreshold;
    const investInRange = Math.max(0, cumulativeInvest - currentThreshold);
    const progress = Math.min(100, (investInRange / rangeTotal) * 100);
    const remaining = Math.max(0, nextThreshold - cumulativeInvest);

    return {
      isMaxLevel: false,
      progress: parseFloat(progress.toFixed(2)),
      remaining,
      nextLevel: nextRequirement
    };
  },

  /**
   * Log VIP upgrade event locally
   * @param {Object} upgradeInfo - Upgrade details
   */
  logUpgrade(upgradeInfo) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.UPGRADE_LOG_KEY) || '[]');
      logs.push({
        ...upgradeInfo,
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      localStorage.setItem(this.UPGRADE_LOG_KEY, JSON.stringify(logs));
      console.log('[VipUpgrade] Logged upgrade:', upgradeInfo);
    } catch (err) {
      console.error('[VipUpgrade] Failed to log upgrade:', err);
    }
  },

  /**
   * Get upgrade history
   * @returns {Array} Upgrade logs
   */
  getUpgradeHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.UPGRADE_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Check and perform VIP upgrade if qualified
   * Note: The actual upgrade is performed server-side
   * This method checks eligibility and logs the process
   * @returns {Promise<Object>} Upgrade check result
   */
  async checkAndUpgrade() {
    try {
      // Get current VIP info
      const vipInfo = await this.getCurrentVipInfo();
      const { currentLevel, cumulativeInvest, userId, username } = vipInfo;

      // Determine qualified level
      const qualifiedLevelConfig = this.determineQualifiedLevel(cumulativeInvest);
      const qualifiedLevel = qualifiedLevelConfig.level;

      // Check if upgrade is needed
      const shouldUpgrade = qualifiedLevel > currentLevel;
      const levelsSkipped = qualifiedLevel - currentLevel;

      // Calculate progress to next level
      const progress = this.calculateUpgradeProgress(cumulativeInvest, qualifiedLevel);

      const result = {
        userId,
        username,
        previousLevel: currentLevel,
        qualifiedLevel,
        currentCumulativeInvest: cumulativeInvest,
        shouldUpgrade,
        levelsSkipped: shouldUpgrade ? levelsSkipped : 0,
        benefits: qualifiedLevelConfig,
        nextLevelProgress: progress
      };

      // Log the upgrade if it occurred
      if (shouldUpgrade) {
        this.logUpgrade({
          type: 'vip_upgrade',
          userId,
          fromLevel: currentLevel,
          toLevel: qualifiedLevel,
          cumulativeInvest,
          levelsSkipped
        });

        console.log(
          `[VipUpgrade] User ${userId} upgraded from VIP${currentLevel} to VIP${qualifiedLevel}`
        );
      }

      return result;
    } catch (err) {
      console.error('[VipUpgrade] Check and upgrade failed:', err);
      throw err;
    }
  },

  /**
   * Get VIP level benefits
   * @param {number} level - VIP level
   * @returns {Object} Level benefits
   */
  getLevelBenefits(level) {
    const levelConfig = this.VIP_LEVELS.find(v => v.level === level);
    if (!levelConfig) {
      return this.VIP_LEVELS[0];
    }
    return { ...levelConfig };
  },

  /**
   * Format VIP level display
   * @param {number} level - VIP level
   * @returns {string} Formatted display string
   */
  formatVipDisplay(level) {
    const config = this.getLevelBenefits(level);
    return config.name || `VIP${level}`;
  },

  /**
   * Get all VIP levels for display
   * @returns {Array} All VIP level configurations
   */
  getAllLevels() {
    return this.VIP_LEVELS.map(level => ({
      ...level,
      minInvestFormatted: this.formatMoney(level.minInvest),
      extraRateFormatted: `+${level.extraRate}%`
    }));
  },

  /**
   * Format money display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatMoney(amount) {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(0) + '万';
    }
    return amount.toLocaleString('zh-CN');
  }
};

// Export for use in other modules (Node.js/CommonJS)
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = VipUpgradeService;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.VipUpgradeService = VipUpgradeService;
}
