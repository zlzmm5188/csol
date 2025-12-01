/**
 * Providence Backend System
 * Main entry point for all backend services
 * Version: 1.0.0
 */

// Configuration modules
const vipConfig = require('./config/vip-config');
const teamRewardsConfig = require('./config/team-rewards-config');
const paymentConfig = require('./config/payment-config');

// Service modules
const userIdService = require('./services/user-id-service');
const teamService = require('./services/team-service');
const calendarService = require('./services/calendar-service');

// Admin modules
const dashboardService = require('./admin/dashboard-service');

/**
 * Providence Backend API
 */
const Providence = {
    // Version
    version: '1.0.0',
    
    // VIP Configuration
    vip: {
        LEVELS: vipConfig.VIP_LEVELS,
        LEVELS_ARRAY: vipConfig.VIP_LEVELS_ARRAY,
        getConfig: vipConfig.getVipConfig,
        calculateLevel: vipConfig.calculateVipLevel,
        getUpgradeRequirements: vipConfig.getUpgradeRequirements,
        calculateCommission: vipConfig.calculateCommission
    },
    
    // Team Rewards
    teamRewards: {
        REWARDS: teamRewardsConfig.TEAM_REWARDS,
        calculate: teamRewardsConfig.calculateTeamRewards,
        getReward: teamRewardsConfig.getTeamReward,
        validateClaim: teamRewardsConfig.validateRewardClaim
    },
    
    // Payment System
    payment: {
        METHODS: paymentConfig.PAYMENT_METHODS,
        REBATE_CONFIG: paymentConfig.REBATE_CONFIG,
        setExchangeRate: paymentConfig.setExchangeRate,
        getExchangeRate: paymentConfig.getExchangeRate,
        cnyToUsdt: paymentConfig.cnyToUsdt,
        usdtToCny: paymentConfig.usdtToCny,
        calculateRebate: paymentConfig.calculateRebate,
        getPaymentMethod: paymentConfig.getPaymentMethod,
        getEnabledPaymentMethods: paymentConfig.getEnabledPaymentMethods,
        validatePaymentAmount: paymentConfig.validatePaymentAmount
    },
    
    // User ID Service
    userId: {
        CONFIG: userIdService.USER_ID_CONFIG,
        generate: userIdService.generateRandomUserId,
        isFoundingMember: userIdService.isFoundingMember,
        reserve: userIdService.reserveUserId,
        release: userIdService.releaseUserId,
        generateReferralLink: userIdService.generateReferralLink,
        parseInviteCode: userIdService.parseInviteCode,
        validateInviteCode: userIdService.validateInviteCode,
        createUserWithId: userIdService.createUserWithId
    },
    
    // Team Management
    team: {
        MEMBER_STATUS: teamService.MEMBER_STATUS,
        TeamMember: teamService.TeamMember,
        TeamManagementService: teamService.TeamManagementService,
        calculateCommissionWithInternalCheck: teamService.calculateCommissionWithInternalCheck,
        instance: teamService.teamService
    },
    
    // Calendar Statistics
    calendar: {
        ENTRY_TYPES: calendarService.CALENDAR_ENTRY_TYPES,
        CalendarEntry: calendarService.CalendarEntry,
        CalendarStatisticsService: calendarService.CalendarStatisticsService,
        instance: calendarService.calendarService
    },
    
    // Admin Dashboard
    admin: {
        TIME_RANGES: dashboardService.DASHBOARD_TIME_RANGES,
        AdminDashboardService: dashboardService.AdminDashboardService,
        instance: dashboardService.adminDashboard
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Providence;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.Providence = Providence;
}
