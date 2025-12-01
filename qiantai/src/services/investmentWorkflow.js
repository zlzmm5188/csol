/**
 * Investment Order Workflow Service
 * Handles the complete investment lifecycle
 *
 * Flow:
 * 1. Create investment order
 * 2. Deduct and freeze user balance
 * 3. Calculate and distribute rebates (L1/L2 based on VIP level)
 * 4. Check and upgrade VIP level based on cumulative investment
 * 5. Check and provide team rewards to direct recommender
 * 6. Activate investment order, start interest calculation
 */

const InvestmentWorkflowService = {
  /**
   * VIP Level Configuration
   * Based on cumulative investment thresholds
   */
  VIP_LEVELS: [
    { level: 0, minInvest: 0, extraRate: 0, rebateL1: 1, rebateL2: 0 },
    { level: 1, minInvest: 30000, extraRate: 0.05, rebateL1: 2, rebateL2: 1 },
    { level: 2, minInvest: 100000, extraRate: 0.1, rebateL1: 3, rebateL2: 2 },
    { level: 3, minInvest: 250000, extraRate: 0.12, rebateL1: 4, rebateL2: 2 },
    { level: 4, minInvest: 800000, extraRate: 0.15, rebateL1: 5, rebateL2: 3 },
    { level: 5, minInvest: 1500000, extraRate: 0.16, rebateL1: 5, rebateL2: 4 },
    { level: 6, minInvest: 3800000, extraRate: 0.18, rebateL1: 6, rebateL2: 4 },
    { level: 7, minInvest: 8000000, extraRate: 0.23, rebateL1: 6, rebateL2: 5 },
    { level: 8, minInvest: 13000000, extraRate: 0.25, rebateL1: 7, rebateL2: 5 }
  ],

  /**
   * Team Reward Configuration
   * Based on subordinate count and team investment
   */
  TEAM_REWARDS: [
    { minMembers: 3, minInvest: 80000, points: 2000 },
    { minMembers: 5, minInvest: 150000, points: 3900 },
    { minMembers: 10, minInvest: 500000, points: 12000 },
    { minMembers: 20, minInvest: 1500000, points: 35000 },
    { minMembers: 50, minInvest: 3800000, points: 50000 },
    { minMembers: 100, minInvest: 8800000, points: 75000 },
    { minMembers: 200, minInvest: 15000000, points: 150000 },
    { minMembers: 500, minInvest: 58000000, points: 200000 },
    { minMembers: 1000, minInvest: 98000000, points: 380000 }
  ],

  /**
   * Get API base URL and token
   */
  getApiConfig() {
    const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
    const token = window.TokenManager?.getToken?.() ||
      localStorage.getItem('providence_token') || '';
    return { API_BASE, token };
  },

  /**
   * Step 1: Create investment order
   * @param {Object} orderData - Order details
   * @param {number} orderData.projectId - Project ID
   * @param {number} orderData.amount - Investment amount
   * @param {string} orderData.currency - Currency type (CNY/USDT)
   * @returns {Promise<Object>} Order creation result
   */
  async createOrder(orderData) {
    const { API_BASE, token } = this.getApiConfig();

    if (!token) {
      throw new Error('用户未登录');
    }

    if (!orderData.projectId || orderData.amount <= 0) {
      throw new Error('投资参数无效');
    }

    // Generate idempotency key to prevent duplicate orders
    const idempotencyKey = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await fetch(`${API_BASE}/fund/api/project/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Token: token,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          project_id: orderData.projectId,
          amount: orderData.amount,
          currency: orderData.currency || 'CNY'
        })
      });

      const data = await response.json();

      if (data.code === 1) {
        console.log('[Investment] Order created successfully:', data.data);
        return {
          success: true,
          orderId: data.data?.order_id,
          orderNo: data.data?.order_no,
          data: data.data
        };
      } else {
        throw new Error(data.msg || '创建订单失败');
      }
    } catch (err) {
      console.error('[Investment] Create order failed:', err);
      throw err;
    }
  },

  /**
   * Step 2: Get balance deduction status
   * Balance deduction is handled server-side during order creation
   * This method retrieves the current frozen balance
   * @returns {Promise<Object>} Balance info
   */
  async getBalanceInfo() {
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
        return {
          balance: parseFloat(data.data.money || data.data.balance || 0),
          frozenBalance: parseFloat(data.data.frozen_balance || data.data.frozen || 0),
          totalRecharge: parseFloat(data.data.recharges || 0),
          cumulativeInvest: parseFloat(data.data.cumulative_invest || data.data.recharges || 0)
        };
      }
      throw new Error('获取余额信息失败');
    } catch (err) {
      console.error('[Investment] Get balance failed:', err);
      throw err;
    }
  },

  /**
   * Step 3: Calculate rebate based on recommender's VIP level
   * @param {number} amount - Investment amount
   * @param {number} recommenderVipLevel - Recommender's VIP level
   * @param {number} rebateLevel - 1 for direct (L1), 2 for indirect (L2)
   * @returns {Object} Rebate calculation result
   */
  calculateRebate(amount, recommenderVipLevel, rebateLevel = 1) {
    const vipConfig = this.VIP_LEVELS.find(v => v.level === recommenderVipLevel) ||
      this.VIP_LEVELS[0];

    const rebateRate = rebateLevel === 1 ? vipConfig.rebateL1 : vipConfig.rebateL2;
    const rebateAmount = (amount * rebateRate) / 100;

    return {
      rate: rebateRate,
      amount: rebateAmount,
      vipLevel: recommenderVipLevel,
      rebateLevel
    };
  },

  /**
   * Step 4: Check and calculate VIP level based on cumulative investment
   * @param {number} cumulativeInvest - Total cumulative investment
   * @returns {Object} VIP level result
   */
  determineVipLevel(cumulativeInvest) {
    let qualifiedLevel = this.VIP_LEVELS[0];

    for (let i = this.VIP_LEVELS.length - 1; i >= 0; i--) {
      if (cumulativeInvest >= this.VIP_LEVELS[i].minInvest) {
        qualifiedLevel = this.VIP_LEVELS[i];
        break;
      }
    }

    return {
      level: qualifiedLevel.level,
      minInvest: qualifiedLevel.minInvest,
      extraRate: qualifiedLevel.extraRate,
      rebateL1: qualifiedLevel.rebateL1,
      rebateL2: qualifiedLevel.rebateL2
    };
  },

  /**
   * Step 5: Check and calculate team reward tier
   * @param {number} memberCount - Direct subordinate count
   * @param {number} teamInvest - Team total investment
   * @returns {Object|null} Team reward result or null if not qualified
   */
  determineTeamReward(memberCount, teamInvest) {
    let qualifiedTier = null;

    for (let i = this.TEAM_REWARDS.length - 1; i >= 0; i--) {
      const tier = this.TEAM_REWARDS[i];
      if (memberCount >= tier.minMembers && teamInvest >= tier.minInvest) {
        qualifiedTier = {
          tier: i + 1,
          minMembers: tier.minMembers,
          minInvest: tier.minInvest,
          points: tier.points
        };
        break;
      }
    }

    return qualifiedTier;
  },

  /**
   * Get team statistics for the current user
   * @returns {Promise<Object>} Team stats
   */
  async getTeamStats() {
    const { API_BASE, token } = this.getApiConfig();

    try {
      const response = await fetch(`${API_BASE}/user/team/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Token: token
        }
      });

      const data = await response.json();

      if (data.code === 1 && data.data) {
        return {
          level1Count: parseInt(data.data.level1_count || 0),
          level2Count: parseInt(data.data.level2_count || 0),
          totalMembers: parseInt(data.data.total_members || 0),
          teamInvest: parseFloat(data.data.team_invest || 0),
          currentRewardTier: parseInt(data.data.reward_tier || 0)
        };
      }

      // Fallback: try alternative endpoint
      const altResponse = await fetch(`${API_BASE}/api/team/reward-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Token: token
        }
      });

      const altData = await altResponse.json();
      if (altData.code === 1 || altData.data) {
        const teamData = altData.data || altData;
        return {
          level1Count: parseInt(teamData.level1_count || teamData.direct_count || 0),
          level2Count: parseInt(teamData.level2_count || teamData.indirect_count || 0),
          totalMembers: parseInt(teamData.total_members || teamData.total || 0),
          teamInvest: parseFloat(teamData.team_invest || teamData.total_invest || 0),
          currentRewardTier: parseInt(teamData.reward_tier || 0)
        };
      }

      return { level1Count: 0, level2Count: 0, totalMembers: 0, teamInvest: 0, currentRewardTier: 0 };
    } catch (err) {
      console.error('[Investment] Get team stats failed:', err);
      return { level1Count: 0, level2Count: 0, totalMembers: 0, teamInvest: 0, currentRewardTier: 0 };
    }
  },

  /**
   * Get current VIP level for the user
   * @returns {Promise<number>} VIP level
   */
  async getCurrentVipLevel() {
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
        return parseInt(data.data.vip_level || data.data.level || data.data.vipLevel || 0);
      }

      return 0;
    } catch (err) {
      console.error('[Investment] Get VIP level failed:', err);
      return 0;
    }
  },

  /**
   * Execute the complete investment workflow
   * @param {Object} investmentData - Investment details
   * @returns {Promise<Object>} Workflow result
   */
  async executeWorkflow(investmentData) {
    const workflowLog = {
      timestamp: new Date().toISOString(),
      steps: []
    };

    try {
      // Step 1: Create the investment order
      workflowLog.steps.push({ step: 'createOrder', status: 'pending' });
      const orderResult = await this.createOrder(investmentData);
      workflowLog.steps[0].status = 'completed';
      workflowLog.steps[0].data = orderResult;

      // Step 2: Get updated balance info (balance deducted server-side)
      workflowLog.steps.push({ step: 'getBalance', status: 'pending' });
      const balanceInfo = await this.getBalanceInfo();
      workflowLog.steps[1].status = 'completed';
      workflowLog.steps[1].data = balanceInfo;

      // Step 3: Check VIP level upgrade
      workflowLog.steps.push({ step: 'checkVipUpgrade', status: 'pending' });
      const newVipLevel = this.determineVipLevel(balanceInfo.cumulativeInvest);
      const currentVipLevel = await this.getCurrentVipLevel();
      const vipUpgraded = newVipLevel.level > currentVipLevel;
      workflowLog.steps[2].status = 'completed';
      workflowLog.steps[2].data = {
        currentLevel: currentVipLevel,
        qualifiedLevel: newVipLevel.level,
        upgraded: vipUpgraded
      };

      // Step 4: Check team reward eligibility
      workflowLog.steps.push({ step: 'checkTeamReward', status: 'pending' });
      const teamStats = await this.getTeamStats();
      const teamReward = this.determineTeamReward(
        teamStats.level1Count,
        teamStats.teamInvest
      );
      workflowLog.steps[3].status = 'completed';
      workflowLog.steps[3].data = {
        teamStats,
        reward: teamReward,
        newRewardTier: teamReward ? teamReward.tier : 0
      };

      console.log('[Investment] Workflow completed:', workflowLog);

      return {
        success: true,
        orderId: orderResult.orderId,
        orderNo: orderResult.orderNo,
        balanceAfter: balanceInfo.balance,
        vipLevel: {
          current: currentVipLevel,
          qualified: newVipLevel.level,
          upgraded: vipUpgraded,
          benefits: newVipLevel
        },
        teamReward: teamReward,
        workflowLog
      };
    } catch (err) {
      console.error('[Investment] Workflow failed:', err);
      workflowLog.error = err.message;
      return {
        success: false,
        error: err.message,
        workflowLog
      };
    }
  }
};

// Export for use in other modules (Node.js/CommonJS)
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = InvestmentWorkflowService;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.InvestmentWorkflowService = InvestmentWorkflowService;
}
