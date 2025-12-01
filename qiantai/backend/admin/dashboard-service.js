/**
 * Providence Admin Dashboard Service
 * Backend dashboard overview and statistics
 * Separate RMB and USDT transactions
 */

/**
 * Dashboard time ranges
 */
const DASHBOARD_TIME_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_YEAR: 'this_year',
    CUSTOM: 'custom'
};

/**
 * Admin Dashboard Service
 */
class AdminDashboardService {
    constructor() {
        // In-memory data stores (replace with database in production)
        this.users = new Map();
        this.transactions = [];
        this.registrations = [];
    }
    
    /**
     * Get date range for a time period
     * @param {string} range - Time range type
     * @param {Object} customRange - Custom date range {start, end}
     * @returns {Object} Start and end dates
     */
    getDateRange(range, customRange = null) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (range) {
            case DASHBOARD_TIME_RANGES.TODAY:
                return {
                    start: today,
                    end: new Date(today.getTime() + 86400000 - 1)
                };
            
            case DASHBOARD_TIME_RANGES.YESTERDAY:
                const yesterday = new Date(today.getTime() - 86400000);
                return {
                    start: yesterday,
                    end: new Date(today.getTime() - 1)
                };
            
            case DASHBOARD_TIME_RANGES.LAST_7_DAYS:
                return {
                    start: new Date(today.getTime() - 7 * 86400000),
                    end: new Date(today.getTime() + 86400000 - 1)
                };
            
            case DASHBOARD_TIME_RANGES.LAST_30_DAYS:
                return {
                    start: new Date(today.getTime() - 30 * 86400000),
                    end: new Date(today.getTime() + 86400000 - 1)
                };
            
            case DASHBOARD_TIME_RANGES.THIS_MONTH:
                return {
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(today.getTime() + 86400000 - 1)
                };
            
            case DASHBOARD_TIME_RANGES.LAST_MONTH:
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                return {
                    start: lastMonth,
                    end: new Date(lastMonthEnd.getTime() + 86400000 - 1)
                };
            
            case DASHBOARD_TIME_RANGES.THIS_YEAR:
                return {
                    start: new Date(now.getFullYear(), 0, 1),
                    end: new Date(today.getTime() + 86400000 - 1)
                };
            
            case DASHBOARD_TIME_RANGES.CUSTOM:
                if (customRange && customRange.start && customRange.end) {
                    return {
                        start: new Date(customRange.start),
                        end: new Date(customRange.end)
                    };
                }
                throw new Error('Custom range requires start and end dates');
            
            default:
                return {
                    start: today,
                    end: new Date(today.getTime() + 86400000 - 1)
                };
        }
    }
    
    /**
     * Get dashboard overview statistics
     * @param {string} timeRange - Time range
     * @param {Object} customRange - Custom date range (optional)
     * @returns {Object} Dashboard overview data
     */
    getDashboardOverview(timeRange = DASHBOARD_TIME_RANGES.TODAY, customRange = null) {
        const { start, end } = this.getDateRange(timeRange, customRange);
        
        // Filter transactions within date range
        const filteredTxns = this.transactions.filter(t => {
            const txnDate = new Date(t.createdAt);
            return txnDate >= start && txnDate <= end;
        });
        
        // Filter registrations within date range
        const filteredRegs = this.registrations.filter(r => {
            const regDate = new Date(r.createdAt);
            return regDate >= start && regDate <= end;
        });
        
        // Calculate RMB totals
        const rmbRecharges = filteredTxns
            .filter(t => t.type === 'recharge' && t.currency === 'CNY')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const rmbWithdrawals = filteredTxns
            .filter(t => t.type === 'withdraw' && t.currency === 'CNY')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Calculate USDT totals
        const usdtRecharges = filteredTxns
            .filter(t => t.type === 'recharge' && t.currency === 'USDT')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const usdtWithdrawals = filteredTxns
            .filter(t => t.type === 'withdraw' && t.currency === 'USDT')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Count pending transactions
        const pendingRecharges = filteredTxns.filter(t => 
            t.type === 'recharge' && t.status === 'pending'
        ).length;
        
        const pendingWithdrawals = filteredTxns.filter(t => 
            t.type === 'withdraw' && t.status === 'pending'
        ).length;
        
        return {
            timeRange,
            dateRange: {
                start: start.toISOString(),
                end: end.toISOString()
            },
            
            // Registration stats
            newRegistrations: filteredRegs.length,
            totalUsers: this.users.size,
            
            // RMB Transaction Summary
            rmb: {
                totalRecharge: rmbRecharges,
                totalWithdrawal: rmbWithdrawals,
                netFlow: rmbRecharges - rmbWithdrawals,
                rechargeCount: filteredTxns.filter(t => t.type === 'recharge' && t.currency === 'CNY').length,
                withdrawalCount: filteredTxns.filter(t => t.type === 'withdraw' && t.currency === 'CNY').length
            },
            
            // USDT Transaction Summary
            usdt: {
                totalRecharge: usdtRecharges,
                totalWithdrawal: usdtWithdrawals,
                netFlow: usdtRecharges - usdtWithdrawals,
                rechargeCount: filteredTxns.filter(t => t.type === 'recharge' && t.currency === 'USDT').length,
                withdrawalCount: filteredTxns.filter(t => t.type === 'withdraw' && t.currency === 'USDT').length
            },
            
            // Pending transactions requiring attention
            pending: {
                recharges: pendingRecharges,
                withdrawals: pendingWithdrawals,
                total: pendingRecharges + pendingWithdrawals
            },
            
            // Combined totals
            combined: {
                totalTransactions: filteredTxns.length,
                totalRechargeValue: rmbRecharges + (usdtRecharges * 7.2), // Convert USDT to CNY for combined view
                totalWithdrawalValue: rmbWithdrawals + (usdtWithdrawals * 7.2)
            }
        };
    }
    
    /**
     * Get daily breakdown for chart display
     * @param {string} timeRange - Time range
     * @param {Object} customRange - Custom date range
     * @returns {Array} Daily breakdown data
     */
    getDailyBreakdown(timeRange = DASHBOARD_TIME_RANGES.LAST_7_DAYS, customRange = null) {
        const { start, end } = this.getDateRange(timeRange, customRange);
        const days = Math.ceil((end - start) / 86400000);
        const breakdown = [];
        
        for (let i = 0; i < days; i++) {
            const dayStart = new Date(start.getTime() + i * 86400000);
            const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
            const dateStr = dayStart.toISOString().split('T')[0];
            
            const dayTxns = this.transactions.filter(t => {
                const txnDate = new Date(t.createdAt);
                return txnDate >= dayStart && txnDate <= dayEnd;
            });
            
            const dayRegs = this.registrations.filter(r => {
                const regDate = new Date(r.createdAt);
                return regDate >= dayStart && regDate <= dayEnd;
            });
            
            breakdown.push({
                date: dateStr,
                registrations: dayRegs.length,
                rmb: {
                    recharge: dayTxns.filter(t => t.type === 'recharge' && t.currency === 'CNY')
                                    .reduce((s, t) => s + t.amount, 0),
                    withdrawal: dayTxns.filter(t => t.type === 'withdraw' && t.currency === 'CNY')
                                      .reduce((s, t) => s + t.amount, 0)
                },
                usdt: {
                    recharge: dayTxns.filter(t => t.type === 'recharge' && t.currency === 'USDT')
                                    .reduce((s, t) => s + t.amount, 0),
                    withdrawal: dayTxns.filter(t => t.type === 'withdraw' && t.currency === 'USDT')
                                      .reduce((s, t) => s + t.amount, 0)
                }
            });
        }
        
        return breakdown;
    }
    
    /**
     * Get recent transactions list
     * @param {number} limit - Number of transactions to return
     * @param {string} type - Filter by type (recharge/withdraw/all)
     * @param {string} status - Filter by status (pending/approved/rejected/all)
     * @returns {Array} Recent transactions
     */
    getRecentTransactions(limit = 20, type = 'all', status = 'all') {
        let filtered = [...this.transactions];
        
        if (type !== 'all') {
            filtered = filtered.filter(t => t.type === type);
        }
        
        if (status !== 'all') {
            filtered = filtered.filter(t => t.status === status);
        }
        
        return filtered
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
    
    /**
     * Get user growth statistics
     * @param {number} days - Number of days to analyze
     * @returns {Object} User growth data
     */
    getUserGrowthStats(days = 30) {
        const { start, end } = this.getDateRange(DASHBOARD_TIME_RANGES.CUSTOM, {
            start: new Date(Date.now() - days * 86400000),
            end: new Date()
        });
        
        const dailyGrowth = [];
        let cumulative = this.users.size - this.registrations.filter(r => 
            new Date(r.createdAt) >= start
        ).length;
        
        for (let i = 0; i < days; i++) {
            const dayStart = new Date(start.getTime() + i * 86400000);
            const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
            const dateStr = dayStart.toISOString().split('T')[0];
            
            const dayRegs = this.registrations.filter(r => {
                const regDate = new Date(r.createdAt);
                return regDate >= dayStart && regDate <= dayEnd;
            }).length;
            
            cumulative += dayRegs;
            
            dailyGrowth.push({
                date: dateStr,
                newUsers: dayRegs,
                totalUsers: cumulative
            });
        }
        
        return {
            dailyGrowth,
            totalNewUsers: dailyGrowth.reduce((sum, d) => sum + d.newUsers, 0),
            averageDailyGrowth: dailyGrowth.reduce((sum, d) => sum + d.newUsers, 0) / days
        };
    }
    
    /**
     * Get VIP distribution statistics
     * @returns {Object} VIP distribution data
     */
    getVipDistribution() {
        const distribution = {};
        
        for (let i = 0; i <= 8; i++) {
            distribution[`VIP${i}`] = 0;
        }
        
        for (const user of this.users.values()) {
            const level = `VIP${user.vipLevel || 0}`;
            distribution[level] = (distribution[level] || 0) + 1;
        }
        
        return distribution;
    }
    
    /**
     * Get top performers
     * @param {string} metric - Metric to rank by (recharges/investments/team)
     * @param {number} limit - Number of results
     * @returns {Array} Top performers
     */
    getTopPerformers(metric = 'recharges', limit = 10) {
        const users = Array.from(this.users.values());
        
        switch (metric) {
            case 'recharges':
                return users
                    .sort((a, b) => (b.recharges || 0) - (a.recharges || 0))
                    .slice(0, limit)
                    .map(u => ({
                        id: u.id,
                        username: u.username,
                        vipLevel: u.vipLevel,
                        value: u.recharges || 0
                    }));
            
            case 'investments':
                return users
                    .sort((a, b) => (b.investments || 0) - (a.investments || 0))
                    .slice(0, limit)
                    .map(u => ({
                        id: u.id,
                        username: u.username,
                        vipLevel: u.vipLevel,
                        value: u.investments || 0
                    }));
            
            case 'team':
                return users
                    .sort((a, b) => (b.teamCount || 0) - (a.teamCount || 0))
                    .slice(0, limit)
                    .map(u => ({
                        id: u.id,
                        username: u.username,
                        vipLevel: u.vipLevel,
                        value: u.teamCount || 0
                    }));
            
            default:
                return [];
        }
    }
    
    // Helper methods for adding test data
    addUser(userData) {
        this.users.set(userData.id, userData);
        this.registrations.push({
            userId: userData.id,
            createdAt: userData.createdAt || new Date().toISOString()
        });
    }
    
    addTransaction(txnData) {
        this.transactions.push({
            id: txnData.id || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...txnData,
            createdAt: txnData.createdAt || new Date().toISOString()
        });
    }
}

// Create singleton instance
const adminDashboard = new AdminDashboardService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DASHBOARD_TIME_RANGES,
        AdminDashboardService,
        adminDashboard
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.AdminDashboard = {
        TIME_RANGES: DASHBOARD_TIME_RANGES,
        AdminDashboardService,
        instance: adminDashboard
    };
}
