/**
 * Providence VIP Configuration
 * VIP Membership and Commission Rates
 * Based on requirements specification
 */

// VIP Level Configuration
// 会员升级      累计投资       额外加息
const VIP_LEVELS = {
    VIP0: {
        level: 0,
        name: 'VIP0',
        minInvestment: 0,           // 累计投资要求
        extraInterestRate: 0,       // 额外加息 (%)
        commissionL1: 1,            // 一级返佣 (%)
        commissionL2: 0,            // 二级返佣 (%)
        description: '普通会员'
    },
    VIP1: {
        level: 1,
        name: 'VIP1',
        minInvestment: 30000,       // ¥30,000
        extraInterestRate: 0.05,    // +0.05%
        commissionL1: 2,            // 一级返佣 2%
        commissionL2: 1,            // 二级返佣 1%
        description: '初级会员'
    },
    VIP2: {
        level: 2,
        name: 'VIP2',
        minInvestment: 100000,      // ¥100,000
        extraInterestRate: 0.1,     // +0.1%
        commissionL1: 3,            // 一级返佣 3%
        commissionL2: 2,            // 二级返佣 2%
        description: '银牌会员'
    },
    VIP3: {
        level: 3,
        name: 'VIP3',
        minInvestment: 250000,      // ¥250,000
        extraInterestRate: 0.12,    // +0.12%
        commissionL1: 4,            // 一级返佣 4%
        commissionL2: 2,            // 二级返佣 2%
        description: '金牌会员'
    },
    VIP4: {
        level: 4,
        name: 'VIP4',
        minInvestment: 800000,      // ¥800,000
        extraInterestRate: 0.15,    // +0.15%
        commissionL1: 5,            // 一级返佣 5%
        commissionL2: 3,            // 二级返佣 3%
        description: '铂金会员'
    },
    VIP5: {
        level: 5,
        name: 'VIP5',
        minInvestment: 1500000,     // ¥1,500,000
        extraInterestRate: 0.16,    // +0.16%
        commissionL1: 5,            // 一级返佣 5%
        commissionL2: 4,            // 二级返佣 4%
        description: '钻石会员'
    },
    VIP6: {
        level: 6,
        name: 'VIP6',
        minInvestment: 3800000,     // ¥3,800,000
        extraInterestRate: 0.18,    // +0.18%
        commissionL1: 6,            // 一级返佣 6%
        commissionL2: 4,            // 二级返佣 4%
        description: '皇冠会员'
    },
    VIP7: {
        level: 7,
        name: 'VIP7',
        minInvestment: 8000000,     // ¥8,000,000
        extraInterestRate: 0.23,    // +0.23%
        commissionL1: 6,            // 一级返佣 6%
        commissionL2: 5,            // 二级返佣 5%
        description: '至尊会员'
    },
    VIP8: {
        level: 8,
        name: 'VIP8',
        minInvestment: 13000000,    // ¥13,000,000
        extraInterestRate: 0.25,    // +0.25%
        commissionL1: 7,            // 一级返佣 7%
        commissionL2: 5,            // 二级返佣 5%
        description: '传奇会员'
    }
};

// VIP Level Array (sorted by level)
const VIP_LEVELS_ARRAY = Object.values(VIP_LEVELS).sort((a, b) => a.level - b.level);

/**
 * Get VIP level configuration by level number
 * @param {number} level - VIP level (0-8)
 * @returns {Object} VIP configuration
 */
function getVipConfig(level) {
    const vipKey = `VIP${level}`;
    return VIP_LEVELS[vipKey] || VIP_LEVELS.VIP0;
}

/**
 * Calculate VIP level based on total investment
 * @param {number} totalInvestment - Total accumulated investment in RMB
 * @returns {Object} VIP level configuration
 */
function calculateVipLevel(totalInvestment) {
    let highestLevel = VIP_LEVELS.VIP0;
    
    for (const vip of VIP_LEVELS_ARRAY) {
        if (totalInvestment >= vip.minInvestment) {
            highestLevel = vip;
        } else {
            break;
        }
    }
    
    return highestLevel;
}

/**
 * Get upgrade requirements for next VIP level
 * @param {number} currentLevel - Current VIP level
 * @param {number} totalInvestment - Current total investment
 * @returns {Object} Upgrade requirements
 */
function getUpgradeRequirements(currentLevel, totalInvestment) {
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > 8) {
        return {
            isMaxLevel: true,
            currentLevel: currentLevel,
            message: '已达到最高等级'
        };
    }
    
    const nextVip = getVipConfig(nextLevel);
    const amountNeeded = Math.max(0, nextVip.minInvestment - totalInvestment);
    const progress = totalInvestment / nextVip.minInvestment * 100;
    
    return {
        isMaxLevel: false,
        currentLevel: currentLevel,
        nextLevel: nextLevel,
        nextLevelName: nextVip.name,
        nextLevelMinInvestment: nextVip.minInvestment,
        currentInvestment: totalInvestment,
        amountNeeded: amountNeeded,
        progress: Math.min(progress, 100),
        benefits: {
            extraInterestRate: nextVip.extraInterestRate,
            commissionL1: nextVip.commissionL1,
            commissionL2: nextVip.commissionL2
        }
    };
}

/**
 * Calculate commission based on VIP level
 * @param {number} vipLevel - VIP level of the referrer
 * @param {number} investmentAmount - Investment amount in RMB
 * @param {number} commissionLevel - 1 for direct referral, 2 for indirect
 * @returns {number} Commission amount
 */
function calculateCommission(vipLevel, investmentAmount, commissionLevel = 1) {
    const vipConfig = getVipConfig(vipLevel);
    const rate = commissionLevel === 1 ? vipConfig.commissionL1 : vipConfig.commissionL2;
    return investmentAmount * rate / 100;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VIP_LEVELS,
        VIP_LEVELS_ARRAY,
        getVipConfig,
        calculateVipLevel,
        getUpgradeRequirements,
        calculateCommission
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.VipConfig = {
        VIP_LEVELS,
        VIP_LEVELS_ARRAY,
        getVipConfig,
        calculateVipLevel,
        getUpgradeRequirements,
        calculateCommission
    };
}
