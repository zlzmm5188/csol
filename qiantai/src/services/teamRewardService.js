/**
 * Team Reward Distribution Service
 * Handles team management bonuses and reward distribution
 *
 * Flow:
 * 1. Update when subordinate members complete investments
 * 2. Automatically count direct recommender's subordinate numbers and team investment totals
 * 3. Identify the highest reward tier qualification
 * 4. Upgrade and provide rewards if qualification exceeds current tier
 * 5. Log rewards distribution
 */

const TeamRewardService = {
  /**
   * Team Reward Configuration
   * Points awarded based on subordinate count and team investment
   */
  REWARD_TIERS: [
    { tier: 1, minMembers: 3, minInvest: 80000, points: 2000 },
    { tier: 2, minMembers: 5, minInvest: 150000, points: 3900 },
    { tier: 3, minMembers: 10, minInvest: 500000, points: 12000 },
    { tier: 4, minMembers: 20, minInvest: 1500000, points: 35000 },
    { tier: 5, minMembers: 50, minInvest: 3800000, points: 50000 },
    { tier: 6, minMembers: 100, minInvest: 8800000, points: 75000 },
    { tier: 7, minMembers: 200, minInvest: 15000000, points: 150000 },
    { tier: 8, minMembers: 500, minInvest: 58000000, points: 200000 },
    { tier: 9, minMembers: 1000, minInvest: 98000000, points: 380000 }
  ],

  /**
   * Rebate configuration based on VIP level
   */
  REBATE_RATES: {
    0: { L1: 1, L2: 0 },
    1: { L1: 2, L2: 1 },
    2: { L1: 3, L2: 2 },
    3: { L1: 4, L2: 2 },
    4: { L1: 5, L2: 3 },
    5: { L1: 5, L2: 4 },
    6: { L1: 6, L2: 4 },
    7: { L1: 6, L2: 5 },
    8: { L1: 7, L2: 5 }
  },

  /**
   * Reward log storage key
   */
  REWARD_LOG_KEY: 'team_reward_logs',

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
   * Get team statistics for the current user
   * @returns {Promise<Object>} Team statistics
   */
  async getTeamStats() {
    const { API_BASE, token } = this.getApiConfig();

    try {
      // Try primary endpoint
      let response = await fetch(`${API_BASE}/user/team/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Token: token
        }
      });

      let data = await response.json();

      if (data.code === 1 && data.data) {
        return this.normalizeTeamStats(data.data);
      }

      // Fallback: try alternative endpoint
      response = await fetch(`${API_BASE}/api/team/reward-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Token: token
        }
      });

      data = await response.json();
      if (data.code === 1 || data.data) {
        return this.normalizeTeamStats(data.data || data);
      }

      // Return empty stats if no data available
      return this.getEmptyStats();
    } catch (err) {
      console.error('[TeamReward] Get team stats failed:', err);
      return this.getEmptyStats();
    }
  },

  /**
   * Normalize team statistics from various API response formats
   * @param {Object} rawData - Raw API response data
   * @returns {Object} Normalized stats
   */
  normalizeTeamStats(rawData) {
    return {
      level1Count: parseInt(
        rawData.level1_count ||
        rawData.direct_count ||
        rawData.direct_members ||
        rawData.first_level_count ||
        0
      ),
      level2Count: parseInt(
        rawData.level2_count ||
        rawData.indirect_count ||
        rawData.indirect_members ||
        rawData.second_level_count ||
        0
      ),
      totalMembers: parseInt(
        rawData.total_members ||
        rawData.total ||
        rawData.team_count ||
        0
      ),
      teamInvest: parseFloat(
        rawData.team_invest ||
        rawData.total_invest ||
        rawData.team_investment ||
        0
      ),
      currentRewardTier: parseInt(
        rawData.reward_tier ||
        rawData.current_tier ||
        rawData.achieved_tier ||
        0
      ),
      totalRebateEarned: parseFloat(
        rawData.total_rebate ||
        rawData.commission ||
        0
      ),
      totalPointsEarned: parseInt(
        rawData.total_points ||
        rawData.points_earned ||
        0
      )
    };
  },

  /**
   * Get empty stats object
   * @returns {Object} Empty statistics
   */
  getEmptyStats() {
    return {
      level1Count: 0,
      level2Count: 0,
      totalMembers: 0,
      teamInvest: 0,
      currentRewardTier: 0,
      totalRebateEarned: 0,
      totalPointsEarned: 0
    };
  },

  /**
   * Get team members list
   * @param {number} level - 1 for direct, 2 for indirect
   * @param {number} page - Page number
   * @param {number} pageSize - Items per page
   * @returns {Promise<Object>} Team members data
   */
  async getTeamMembers(level = 1, page = 1, pageSize = 20) {
    const { API_BASE, token } = this.getApiConfig();

    try {
      const response = await fetch(
        `${API_BASE}/team/members?level=${level}&page=${page}&page_size=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Token: token
          }
        }
      );

      const data = await response.json();

      if (data.code === 1 && data.data) {
        return {
          list: data.data.list || [],
          total: data.data.total || 0,
          page: data.data.page || page,
          pageSize: data.data.page_size || pageSize
        };
      }

      return { list: [], total: 0, page, pageSize };
    } catch (err) {
      console.error('[TeamReward] Get team members failed:', err);
      return { list: [], total: 0, page, pageSize };
    }
  },

  /**
   * Determine the highest qualified reward tier
   * @param {number} memberCount - Direct subordinate count
   * @param {number} teamInvest - Team total investment
   * @returns {Object|null} Qualified tier or null
   */
  determineQualifiedTier(memberCount, teamInvest) {
    let qualifiedTier = null;

    for (let i = this.REWARD_TIERS.length - 1; i >= 0; i--) {
      const tier = this.REWARD_TIERS[i];
      if (memberCount >= tier.minMembers && teamInvest >= tier.minInvest) {
        qualifiedTier = {
          ...tier,
          qualified: true
        };
        break;
      }
    }

    return qualifiedTier;
  },

  /**
   * Get all tiers with qualification status
   * @param {number} memberCount - Current member count
   * @param {number} teamInvest - Current team investment
   * @returns {Array} All tiers with status
   */
  getAllTiersWithStatus(memberCount, teamInvest) {
    return this.REWARD_TIERS.map(tier => {
      const membersQualified = memberCount >= tier.minMembers;
      const investQualified = teamInvest >= tier.minInvest;
      const qualified = membersQualified && investQualified;

      return {
        ...tier,
        membersQualified,
        investQualified,
        qualified,
        membersProgress: Math.min(100, (memberCount / tier.minMembers) * 100),
        investProgress: Math.min(100, (teamInvest / tier.minInvest) * 100),
        membersRemaining: Math.max(0, tier.minMembers - memberCount),
        investRemaining: Math.max(0, tier.minInvest - teamInvest)
      };
    });
  },

  /**
   * Calculate rebate for an investment
   * @param {number} investAmount - Investment amount
   * @param {number} recommenderVipLevel - Recommender's VIP level
   * @param {number} rebateLevel - 1 for L1, 2 for L2
   * @returns {Object} Rebate calculation
   */
  calculateRebate(investAmount, recommenderVipLevel, rebateLevel = 1) {
    const rates = this.REBATE_RATES[recommenderVipLevel] || this.REBATE_RATES[0];
    const rate = rebateLevel === 1 ? rates.L1 : rates.L2;
    const amount = (investAmount * rate) / 100;

    return {
      rate,
      amount,
      investAmount,
      vipLevel: recommenderVipLevel,
      rebateLevel
    };
  },

  /**
   * Log reward distribution
   * @param {Object} rewardInfo - Reward details
   */
  logReward(rewardInfo) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.REWARD_LOG_KEY) || '[]');
      logs.push({
        ...rewardInfo,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem(this.REWARD_LOG_KEY, JSON.stringify(logs));
      console.log('[TeamReward] Logged reward:', rewardInfo);
    } catch (err) {
      console.error('[TeamReward] Failed to log reward:', err);
    }
  },

  /**
   * Get reward history
   * @returns {Array} Reward logs
   */
  getRewardHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.REWARD_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Check and update team reward tier
   * @returns {Promise<Object>} Reward check result
   */
  async checkAndUpdateReward() {
    try {
      const stats = await this.getTeamStats();
      const {
        level1Count,
        teamInvest,
        currentRewardTier
      } = stats;

      // Determine qualified tier
      const qualifiedTier = this.determineQualifiedTier(level1Count, teamInvest);
      const newTier = qualifiedTier ? qualifiedTier.tier : 0;
      const shouldUpgrade = newTier > currentRewardTier;
      const pointsToAward = shouldUpgrade && qualifiedTier ? qualifiedTier.points : 0;

      // Get all tiers with status for display
      const allTiers = this.getAllTiersWithStatus(level1Count, teamInvest);

      const result = {
        teamStats: stats,
        currentTier: currentRewardTier,
        qualifiedTier: newTier,
        shouldUpgrade,
        pointsToAward,
        qualifiedTierDetails: qualifiedTier,
        allTiers
      };

      // Log if upgrade occurred
      if (shouldUpgrade) {
        this.logReward({
          type: 'team_reward_upgrade',
          fromTier: currentRewardTier,
          toTier: newTier,
          pointsAwarded: pointsToAward,
          memberCount: level1Count,
          teamInvest
        });

        console.log(
          `[TeamReward] Upgraded from Tier ${currentRewardTier} to Tier ${newTier}, awarded ${pointsToAward} points`
        );
      }

      return result;
    } catch (err) {
      console.error('[TeamReward] Check and update failed:', err);
      throw err;
    }
  },

  /**
   * Process subordinate investment event
   * Called when a team member makes an investment
   * @param {Object} investmentData - Investment details
   * @returns {Promise<Object>} Processing result
   */
  async processSubordinateInvestment(investmentData) {
    const { investAmount, subordinateId, subordinateVipLevel, rebateLevel } = investmentData;

    // Calculate rebate
    const rebate = this.calculateRebate(
      investAmount,
      subordinateVipLevel || 0,
      rebateLevel || 1
    );

    // Check for tier upgrade
    const rewardCheck = await this.checkAndUpdateReward();

    // Log the rebate
    this.logReward({
      type: 'investment_rebate',
      subordinateId,
      investAmount,
      rebateAmount: rebate.amount,
      rebateRate: rebate.rate,
      rebateLevel
    });

    return {
      rebate,
      tierCheck: rewardCheck
    };
  },

  /**
   * Format money for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatMoney(amount) {
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(1) + '亿';
    }
    if (amount >= 10000) {
      return (amount / 10000).toFixed(0) + '万';
    }
    return amount.toLocaleString('zh-CN');
  },

  /**
   * Format number for display
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    return parseInt(num || 0).toLocaleString('zh-CN');
  },

  /**
   * Get tier display info
   * @param {number} tier - Tier number
   * @returns {Object} Tier display information
   */
  getTierDisplayInfo(tier) {
    const tierConfig = this.REWARD_TIERS.find(t => t.tier === tier);
    if (!tierConfig) {
      return {
        tier: 0,
        minMembers: 0,
        minInvest: 0,
        points: 0,
        minMembersFormatted: '0',
        minInvestFormatted: '¥0',
        pointsFormatted: '0'
      };
    }

    return {
      ...tierConfig,
      minMembersFormatted: this.formatNumber(tierConfig.minMembers) + '人',
      minInvestFormatted: '¥' + this.formatMoney(tierConfig.minInvest),
      pointsFormatted: this.formatNumber(tierConfig.points)
    };
  }
};

// Export for use in other modules (Node.js/CommonJS)
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = TeamRewardService;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.TeamRewardService = TeamRewardService;
}
