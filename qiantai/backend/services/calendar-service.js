/**
 * Providence Calendar Statistics Service (日历宝功能)
 * Calendar-based financial tracking and analytics
 */

/**
 * Calendar entry types
 */
const CALENDAR_ENTRY_TYPES = {
    RECHARGE: 'recharge',           // Deposit
    WITHDRAW: 'withdraw',           // Withdrawal
    INVESTMENT: 'investment',       // Project investment
    PROFIT: 'profit',               // Daily profit/earnings
    REBATE: 'rebate',               // Payment rebate
    COMMISSION: 'commission',       // Team commission
    TEAM_REWARD: 'team_reward',     // Team milestone reward
    CHECKIN: 'checkin'              // Daily check-in reward
};

/**
 * Single calendar entry
 */
class CalendarEntry {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.userId = data.userId;
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.type = data.type;
        this.currency = data.currency || 'CNY';  // CNY or USDT
        this.amount = parseFloat(data.amount) || 0;
        this.description = data.description || '';
        this.referenceId = data.referenceId || null;  // Related order/transaction ID
        this.createdAt = data.createdAt || new Date().toISOString();
    }
    
    generateId() {
        return `CAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Calendar Statistics Service
 */
class CalendarStatisticsService {
    constructor() {
        this.entries = new Map();  // userId -> Map(date -> entries[])
    }
    
    /**
     * Add an entry to the calendar
     * @param {Object} entryData - Entry data
     * @returns {CalendarEntry} Created entry
     */
    addEntry(entryData) {
        const entry = new CalendarEntry(entryData);
        
        if (!this.entries.has(entry.userId)) {
            this.entries.set(entry.userId, new Map());
        }
        
        const userEntries = this.entries.get(entry.userId);
        if (!userEntries.has(entry.date)) {
            userEntries.set(entry.date, []);
        }
        
        userEntries.get(entry.date).push(entry);
        return entry;
    }
    
    /**
     * Get entries for a specific date
     * @param {number} userId - User ID
     * @param {string} date - Date string (YYYY-MM-DD)
     * @returns {Array<CalendarEntry>} Entries for the date
     */
    getEntriesByDate(userId, date) {
        const userEntries = this.entries.get(userId);
        if (!userEntries) return [];
        return userEntries.get(date) || [];
    }
    
    /**
     * Get entries for a date range
     * @param {number} userId - User ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Object} Entries grouped by date
     */
    getEntriesByDateRange(userId, startDate, endDate) {
        const userEntries = this.entries.get(userId);
        if (!userEntries) return {};
        
        const result = {};
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (const [date, entries] of userEntries) {
            const d = new Date(date);
            if (d >= start && d <= end) {
                result[date] = entries;
            }
        }
        
        return result;
    }
    
    /**
     * Get monthly statistics
     * @param {number} userId - User ID
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {Object} Monthly statistics
     */
    getMonthlyStats(userId, year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        
        const entriesByDate = this.getEntriesByDateRange(userId, startDate, endDate);
        
        // Initialize stats
        const stats = {
            year,
            month,
            startDate,
            endDate,
            totalDays: lastDay,
            daysWithActivity: 0,
            
            // By currency
            CNY: {
                totalRecharge: 0,
                totalWithdraw: 0,
                totalInvestment: 0,
                totalProfit: 0,
                totalRebate: 0,
                totalCommission: 0,
                netFlow: 0
            },
            USDT: {
                totalRecharge: 0,
                totalWithdraw: 0,
                totalInvestment: 0,
                totalProfit: 0,
                totalRebate: 0,
                totalCommission: 0,
                netFlow: 0
            },
            
            // Daily breakdown
            dailyStats: {},
            
            // By type summary
            byType: {}
        };
        
        // Process entries
        for (const [date, entries] of Object.entries(entriesByDate)) {
            if (entries.length > 0) {
                stats.daysWithActivity++;
            }
            
            const dailyStat = {
                date,
                CNY: { income: 0, expense: 0, net: 0 },
                USDT: { income: 0, expense: 0, net: 0 },
                entries: entries.length
            };
            
            for (const entry of entries) {
                const curr = entry.currency;
                const amount = entry.amount;
                
                // Update by type
                if (!stats.byType[entry.type]) {
                    stats.byType[entry.type] = { CNY: 0, USDT: 0 };
                }
                stats.byType[entry.type][curr] += amount;
                
                // Update currency totals
                switch (entry.type) {
                    case CALENDAR_ENTRY_TYPES.RECHARGE:
                        stats[curr].totalRecharge += amount;
                        dailyStat[curr].income += amount;
                        break;
                    case CALENDAR_ENTRY_TYPES.WITHDRAW:
                        stats[curr].totalWithdraw += amount;
                        dailyStat[curr].expense += amount;
                        break;
                    case CALENDAR_ENTRY_TYPES.INVESTMENT:
                        stats[curr].totalInvestment += amount;
                        dailyStat[curr].expense += amount;
                        break;
                    case CALENDAR_ENTRY_TYPES.PROFIT:
                        stats[curr].totalProfit += amount;
                        dailyStat[curr].income += amount;
                        break;
                    case CALENDAR_ENTRY_TYPES.REBATE:
                        stats[curr].totalRebate += amount;
                        dailyStat[curr].income += amount;
                        break;
                    case CALENDAR_ENTRY_TYPES.COMMISSION:
                        stats[curr].totalCommission += amount;
                        dailyStat[curr].income += amount;
                        break;
                }
            }
            
            dailyStat.CNY.net = dailyStat.CNY.income - dailyStat.CNY.expense;
            dailyStat.USDT.net = dailyStat.USDT.income - dailyStat.USDT.expense;
            stats.dailyStats[date] = dailyStat;
        }
        
        // Calculate net flow
        stats.CNY.netFlow = stats.CNY.totalRecharge + stats.CNY.totalProfit + 
                           stats.CNY.totalRebate + stats.CNY.totalCommission - 
                           stats.CNY.totalWithdraw - stats.CNY.totalInvestment;
        
        stats.USDT.netFlow = stats.USDT.totalRecharge + stats.USDT.totalProfit + 
                            stats.USDT.totalRebate + stats.USDT.totalCommission - 
                            stats.USDT.totalWithdraw - stats.USDT.totalInvestment;
        
        return stats;
    }
    
    /**
     * Get yearly summary
     * @param {number} userId - User ID
     * @param {number} year - Year
     * @returns {Object} Yearly summary with monthly breakdown
     */
    getYearlySummary(userId, year) {
        const summary = {
            year,
            months: [],
            totalCNY: {
                recharge: 0,
                withdraw: 0,
                investment: 0,
                profit: 0,
                rebate: 0,
                commission: 0
            },
            totalUSDT: {
                recharge: 0,
                withdraw: 0,
                investment: 0,
                profit: 0,
                rebate: 0,
                commission: 0
            }
        };
        
        for (let month = 1; month <= 12; month++) {
            const monthStats = this.getMonthlyStats(userId, year, month);
            summary.months.push({
                month,
                CNY: monthStats.CNY,
                USDT: monthStats.USDT,
                daysWithActivity: monthStats.daysWithActivity
            });
            
            // Accumulate totals
            summary.totalCNY.recharge += monthStats.CNY.totalRecharge;
            summary.totalCNY.withdraw += monthStats.CNY.totalWithdraw;
            summary.totalCNY.investment += monthStats.CNY.totalInvestment;
            summary.totalCNY.profit += monthStats.CNY.totalProfit;
            summary.totalCNY.rebate += monthStats.CNY.totalRebate;
            summary.totalCNY.commission += monthStats.CNY.totalCommission;
            
            summary.totalUSDT.recharge += monthStats.USDT.totalRecharge;
            summary.totalUSDT.withdraw += monthStats.USDT.totalWithdraw;
            summary.totalUSDT.investment += monthStats.USDT.totalInvestment;
            summary.totalUSDT.profit += monthStats.USDT.totalProfit;
            summary.totalUSDT.rebate += monthStats.USDT.totalRebate;
            summary.totalUSDT.commission += monthStats.USDT.totalCommission;
        }
        
        return summary;
    }
    
    /**
     * Get calendar view data for a month (for UI display)
     * @param {number} userId - User ID
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {Array} Calendar grid data
     */
    getCalendarView(userId, year, month) {
        const monthStats = this.getMonthlyStats(userId, year, month);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0).getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
        
        const calendar = [];
        let currentWeek = [];
        
        // Fill empty days at start
        for (let i = 0; i < startDayOfWeek; i++) {
            currentWeek.push({ day: null, isCurrentMonth: false });
        }
        
        // Fill days
        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayStats = monthStats.dailyStats[dateStr] || {
                CNY: { income: 0, expense: 0, net: 0 },
                USDT: { income: 0, expense: 0, net: 0 },
                entries: 0
            };
            
            currentWeek.push({
                day,
                date: dateStr,
                isCurrentMonth: true,
                hasActivity: dayStats.entries > 0,
                incomeCNY: dayStats.CNY.income,
                expenseCNY: dayStats.CNY.expense,
                netCNY: dayStats.CNY.net,
                incomeUSDT: dayStats.USDT.income,
                expenseUSDT: dayStats.USDT.expense,
                netUSDT: dayStats.USDT.net,
                entriesCount: dayStats.entries
            });
            
            if (currentWeek.length === 7) {
                calendar.push(currentWeek);
                currentWeek = [];
            }
        }
        
        // Fill remaining days
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push({ day: null, isCurrentMonth: false });
            }
            calendar.push(currentWeek);
        }
        
        return {
            year,
            month,
            summary: {
                CNY: monthStats.CNY,
                USDT: monthStats.USDT
            },
            calendar
        };
    }
    
    /**
     * Get profit forecast for upcoming days
     * @param {number} userId - User ID
     * @param {number} days - Number of days to forecast
     * @param {Array} activeInvestments - User's active investments
     * @returns {Array} Forecast data
     */
    getProfitForecast(userId, days, activeInvestments) {
        const forecast = [];
        const today = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            let dailyProfit = 0;
            let expiringInvestments = [];
            
            for (const inv of activeInvestments) {
                const endDate = new Date(inv.endDate);
                const isPastEnd = date > endDate;
                
                if (!isPastEnd) {
                    dailyProfit += inv.dailyProfit || 0;
                }
                
                if (dateStr === inv.endDate.split('T')[0]) {
                    expiringInvestments.push(inv);
                }
            }
            
            forecast.push({
                date: dateStr,
                dayOfWeek: date.getDay(),
                expectedProfit: dailyProfit,
                expiringInvestments,
                expiringAmount: expiringInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
            });
        }
        
        return forecast;
    }
}

// Create singleton instance
const calendarService = new CalendarStatisticsService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CALENDAR_ENTRY_TYPES,
        CalendarEntry,
        CalendarStatisticsService,
        calendarService
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.CalendarService = {
        ENTRY_TYPES: CALENDAR_ENTRY_TYPES,
        CalendarEntry,
        CalendarStatisticsService,
        instance: calendarService
    };
}
