/**
 * Providence Team Rewards Configuration
 * Team Management Milestone Rewards
 * Based on requirements specification
 */

// Team Rewards Configuration
// 下级成员  累计投资      奖励
const TEAM_REWARDS = [
    {
        id: 1,
        memberCount: 3,          // 下级成员数量
        minInvestment: 80000,    // 累计投资 ¥80,000
        rewardAmount: 1800,      // 奖励 ¥1,800
        rewardType: 'points',    // points 或 cash
        description: '团队初级奖'
    },
    {
        id: 2,
        memberCount: 5,
        minInvestment: 150000,   // ¥150,000
        rewardAmount: 2500,      // ¥2,500
        rewardType: 'points',
        description: '团队进阶奖'
    },
    {
        id: 3,
        memberCount: 10,
        minInvestment: 500000,   // ¥500,000
        rewardAmount: 8800,      // ¥8,800
        rewardType: 'points',
        description: '团队精英奖'
    },
    {
        id: 4,
        memberCount: 20,
        minInvestment: 1500000,  // ¥1,500,000
        rewardAmount: 18000,     // ¥18,000
        rewardType: 'points',
        description: '团队管理奖'
    },
    {
        id: 5,
        memberCount: 50,
        minInvestment: 3800000,  // ¥3,800,000
        rewardAmount: 25000,     // ¥25,000
        rewardType: 'points',
        description: '团队领袖奖'
    },
    {
        id: 6,
        memberCount: 100,
        minInvestment: 8800000,  // ¥8,800,000
        rewardAmount: 38000,     // ¥38,000
        rewardType: 'points',
        description: '团队总监奖'
    },
    {
        id: 7,
        memberCount: 200,
        minInvestment: 15000000, // ¥15,000,000
        rewardAmount: 66000,     // ¥66,000
        rewardType: 'points',
        description: '团队高管奖'
    },
    {
        id: 8,
        memberCount: 500,
        minInvestment: 58000000, // ¥58,000,000
        rewardAmount: 100000,    // ¥100,000
        rewardType: 'points',
        description: '团队董事奖'
    },
    {
        id: 9,
        memberCount: 1000,
        minInvestment: 98000000, // ¥98,000,000
        rewardAmount: 180000,    // ¥180,000
        rewardType: 'points',
        description: '团队传奇奖'
    }
];

/**
 * Calculate eligible team rewards
 * @param {number} teamMemberCount - Number of valid team members (excluding internal staff)
 * @param {number} teamTotalInvestment - Total team investment (excluding internal staff and individual purchases)
 * @param {Array} claimedRewardIds - Array of already claimed reward IDs
 * @returns {Object} Eligible rewards and status
 */
function calculateTeamRewards(teamMemberCount, teamTotalInvestment, claimedRewardIds = []) {
    const result = {
        teamMemberCount,
        teamTotalInvestment,
        eligibleRewards: [],
        claimedRewards: [],
        lockedRewards: [],
        nextMilestone: null,
        totalEarned: 0,
        totalPending: 0
    };
    
    for (const reward of TEAM_REWARDS) {
        const meetsMembers = teamMemberCount >= reward.memberCount;
        const meetsInvestment = teamTotalInvestment >= reward.minInvestment;
        const isClaimed = claimedRewardIds.includes(reward.id);
        
        if (meetsMembers && meetsInvestment) {
            if (isClaimed) {
                result.claimedRewards.push({
                    ...reward,
                    status: 'claimed'
                });
                result.totalEarned += reward.rewardAmount;
            } else {
                result.eligibleRewards.push({
                    ...reward,
                    status: 'claimable'
                });
                result.totalPending += reward.rewardAmount;
            }
        } else {
            // Calculate progress
            const memberProgress = Math.min((teamMemberCount / reward.memberCount) * 100, 100);
            const investProgress = Math.min((teamTotalInvestment / reward.minInvestment) * 100, 100);
            
            result.lockedRewards.push({
                ...reward,
                status: 'locked',
                memberProgress,
                investProgress,
                membersNeeded: Math.max(0, reward.memberCount - teamMemberCount),
                investmentNeeded: Math.max(0, reward.minInvestment - teamTotalInvestment)
            });
            
            // Set next milestone (first locked reward)
            if (!result.nextMilestone) {
                result.nextMilestone = {
                    ...reward,
                    memberProgress,
                    investProgress,
                    membersNeeded: Math.max(0, reward.memberCount - teamMemberCount),
                    investmentNeeded: Math.max(0, reward.minInvestment - teamTotalInvestment)
                };
            }
        }
    }
    
    return result;
}

/**
 * Get team reward by ID
 * @param {number} rewardId - Reward ID
 * @returns {Object|null} Reward configuration
 */
function getTeamReward(rewardId) {
    return TEAM_REWARDS.find(r => r.id === rewardId) || null;
}

/**
 * Validate if a reward can be claimed
 * @param {number} rewardId - Reward ID
 * @param {number} teamMemberCount - Current team member count
 * @param {number} teamTotalInvestment - Current team investment
 * @param {Array} claimedRewardIds - Already claimed reward IDs
 * @returns {Object} Validation result
 */
function validateRewardClaim(rewardId, teamMemberCount, teamTotalInvestment, claimedRewardIds = []) {
    const reward = getTeamReward(rewardId);
    
    if (!reward) {
        return { valid: false, error: '奖励不存在' };
    }
    
    if (claimedRewardIds.includes(rewardId)) {
        return { valid: false, error: '该奖励已领取' };
    }
    
    if (teamMemberCount < reward.memberCount) {
        return { 
            valid: false, 
            error: `团队人数不足，需要 ${reward.memberCount} 人，当前 ${teamMemberCount} 人` 
        };
    }
    
    if (teamTotalInvestment < reward.minInvestment) {
        return { 
            valid: false, 
            error: `团队投资不足，需要 ¥${reward.minInvestment.toLocaleString()}，当前 ¥${teamTotalInvestment.toLocaleString()}` 
        };
    }
    
    return { valid: true, reward };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TEAM_REWARDS,
        calculateTeamRewards,
        getTeamReward,
        validateRewardClaim
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.TeamRewardsConfig = {
        TEAM_REWARDS,
        calculateTeamRewards,
        getTeamReward,
        validateRewardClaim
    };
}
