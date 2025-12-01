/**
 * Providence Team Management Service
 * - Team hierarchy and tree structure
 * - Internal staff management
 * - Team statistics excluding internal staff
 */

/**
 * Team member status types
 */
const MEMBER_STATUS = {
    NORMAL: 'normal',           // Regular member
    INTERNAL: 'internal',       // Internal staff (not counted in team performance)
    INACTIVE: 'inactive',       // Inactive member
    SUSPENDED: 'suspended'      // Suspended member
};

/**
 * Team Member Model
 */
class TeamMember {
    constructor(data) {
        this.id = data.id;
        this.uid = data.uid;
        this.username = data.username;
        this.realname = data.realname || '';
        this.vipLevel = data.vipLevel || 0;
        this.pid = data.pid || 0;           // Parent (referrer) ID
        this.level = data.level || 1;       // Team level (1 = direct, 2 = indirect)
        this.status = data.status || MEMBER_STATUS.NORMAL;
        this.isInternal = data.isInternal || false;
        
        // Financial data
        this.recharges = parseFloat(data.recharges) || 0;    // Total recharges
        this.withdraws = parseFloat(data.withdraws) || 0;    // Total withdrawals
        this.investments = parseFloat(data.investments) || 0; // Total investments
        
        // Timestamps
        this.joinDate = data.joinDate || data.createdAt || new Date().toISOString();
        this.lastActiveDate = data.lastActiveDate || null;
    }
    
    /**
     * Get current holding (recharges - withdrawals)
     */
    get currentHolding() {
        return Math.max(0, this.recharges - this.withdraws);
    }
    
    /**
     * Check if member should be counted in team performance
     */
    get countsInPerformance() {
        return this.status === MEMBER_STATUS.NORMAL && !this.isInternal;
    }
}

/**
 * Team Management Service
 */
class TeamManagementService {
    constructor() {
        this.members = new Map();
        this.internalStaffIds = new Set();
    }
    
    /**
     * Add member to team
     * @param {Object} memberData - Member data
     * @returns {TeamMember} Created team member
     */
    addMember(memberData) {
        const member = new TeamMember(memberData);
        this.members.set(member.id, member);
        
        if (member.isInternal) {
            this.internalStaffIds.add(member.id);
        }
        
        return member;
    }
    
    /**
     * Set member as internal staff
     * @param {number} memberId - Member ID
     * @param {boolean} isInternal - Whether to mark as internal
     * @returns {boolean} Success status
     */
    setInternalStaff(memberId, isInternal = true) {
        const member = this.members.get(memberId);
        if (!member) return false;
        
        member.isInternal = isInternal;
        member.status = isInternal ? MEMBER_STATUS.INTERNAL : MEMBER_STATUS.NORMAL;
        
        if (isInternal) {
            this.internalStaffIds.add(memberId);
        } else {
            this.internalStaffIds.delete(memberId);
        }
        
        return true;
    }
    
    /**
     * Check if member is internal staff
     * @param {number} memberId - Member ID
     * @returns {boolean} True if internal staff
     */
    isInternalStaff(memberId) {
        return this.internalStaffIds.has(memberId);
    }
    
    /**
     * Get direct subordinates (level 1)
     * @param {number} userId - User ID
     * @param {boolean} excludeInternal - Exclude internal staff from results
     * @returns {Array<TeamMember>} Direct subordinates
     */
    getDirectSubordinates(userId, excludeInternal = false) {
        const subordinates = [];
        
        for (const member of this.members.values()) {
            if (member.pid === userId && member.level === 1) {
                if (excludeInternal && member.isInternal) continue;
                subordinates.push(member);
            }
        }
        
        return subordinates;
    }
    
    /**
     * Get indirect subordinates (level 2)
     * @param {number} userId - User ID
     * @param {boolean} excludeInternal - Exclude internal staff from results
     * @returns {Array<TeamMember>} Indirect subordinates
     */
    getIndirectSubordinates(userId, excludeInternal = false) {
        const directIds = this.getDirectSubordinates(userId).map(m => m.id);
        const subordinates = [];
        
        for (const member of this.members.values()) {
            if (directIds.includes(member.pid) && member.level === 2) {
                if (excludeInternal && member.isInternal) continue;
                subordinates.push(member);
            }
        }
        
        return subordinates;
    }
    
    /**
     * Get all subordinates (level 1 and 2)
     * @param {number} userId - User ID
     * @param {boolean} excludeInternal - Exclude internal staff
     * @returns {Object} Subordinates by level
     */
    getAllSubordinates(userId, excludeInternal = false) {
        return {
            level1: this.getDirectSubordinates(userId, excludeInternal),
            level2: this.getIndirectSubordinates(userId, excludeInternal)
        };
    }
    
    /**
     * Calculate team statistics (excluding internal staff for performance)
     * @param {number} userId - User ID
     * @returns {Object} Team statistics
     */
    calculateTeamStats(userId) {
        const all = this.getAllSubordinates(userId, false);
        const counting = this.getAllSubordinates(userId, true);
        
        // Calculate totals for counting members only
        let totalRecharges = 0;
        let totalWithdrawals = 0;
        let totalInvestments = 0;
        
        [...counting.level1, ...counting.level2].forEach(member => {
            totalRecharges += member.recharges;
            totalWithdrawals += member.withdraws;
            totalInvestments += member.investments;
        });
        
        return {
            userId,
            // Total counts (including internal)
            totalMembersAll: all.level1.length + all.level2.length,
            level1CountAll: all.level1.length,
            level2CountAll: all.level2.length,
            
            // Counting members (excluding internal)
            totalMembersCounting: counting.level1.length + counting.level2.length,
            level1CountCounting: counting.level1.length,
            level2CountCounting: counting.level2.length,
            
            // Internal staff count
            internalStaffCount: this.internalStaffIds.size,
            
            // Financial totals (excluding internal)
            totalRecharges,
            totalWithdrawals,
            totalInvestments,
            totalHolding: totalRecharges - totalWithdrawals,
            
            // For team rewards calculation
            teamMemberCount: counting.level1.length + counting.level2.length,
            teamTotalInvestment: totalInvestments
        };
    }
    
    /**
     * Build team tree structure for visualization
     * @param {number} userId - Root user ID
     * @param {number} maxDepth - Maximum depth to traverse
     * @returns {Object} Tree structure
     */
    buildTeamTree(userId, maxDepth = 2) {
        const buildNode = (memberId, currentDepth) => {
            const member = this.members.get(memberId);
            if (!member || currentDepth > maxDepth) return null;
            
            const children = [];
            if (currentDepth < maxDepth) {
                for (const m of this.members.values()) {
                    if (m.pid === memberId) {
                        const childNode = buildNode(m.id, currentDepth + 1);
                        if (childNode) children.push(childNode);
                    }
                }
            }
            
            return {
                id: member.id,
                uid: member.uid,
                username: member.username,
                realname: member.realname,
                vipLevel: member.vipLevel,
                isInternal: member.isInternal,
                status: member.status,
                recharges: member.recharges,
                withdraws: member.withdraws,
                currentHolding: member.currentHolding,
                joinDate: member.joinDate,
                depth: currentDepth,
                childCount: children.length,
                children: children.length > 0 ? children : undefined
            };
        };
        
        // Build tree starting from user's subordinates
        const directSubordinates = this.getDirectSubordinates(userId);
        const tree = {
            rootUserId: userId,
            maxDepth,
            totalNodes: 0,
            children: []
        };
        
        for (const sub of directSubordinates) {
            const node = buildNode(sub.id, 1);
            if (node) {
                tree.children.push(node);
                tree.totalNodes++;
                if (node.children) {
                    tree.totalNodes += node.children.length;
                }
            }
        }
        
        return tree;
    }
    
    /**
     * Get activity data for display
     * @param {number} userId - User ID
     * @returns {Object} Activity information
     */
    getActivityData(userId) {
        const member = this.members.get(userId);
        if (!member) return null;
        
        return {
            userId,
            lastLoginTime: member.lastActiveDate,
            // These would typically come from a separate activity log
            loginTimes: [],
            loginIPs: [],
            devices: [],
            locations: []
        };
    }
}

/**
 * Calculate commission considering internal staff exclusion
 * @param {number} referrerId - Referrer's user ID
 * @param {number} investmentAmount - Investment amount
 * @param {number} level - Commission level (1 or 2)
 * @param {TeamManagementService} teamService - Team service instance
 * @param {Object} vipConfig - VIP configuration
 * @returns {Object} Commission calculation
 */
function calculateCommissionWithInternalCheck(referrerId, investmentAmount, level, teamService, vipConfig) {
    // Check if the investor is internal staff
    // Internal staff investments don't generate commissions
    const isInternalInvestor = teamService.isInternalStaff(referrerId);
    
    if (isInternalInvestor) {
        return {
            referrerId,
            investmentAmount,
            level,
            commissionAmount: 0,
            isInternalInvestor: true,
            message: '内部员工投资不计入佣金'
        };
    }
    
    // Calculate normal commission
    const rate = level === 1 ? vipConfig.commissionL1 : vipConfig.commissionL2;
    const commissionAmount = investmentAmount * rate / 100;
    
    return {
        referrerId,
        investmentAmount,
        level,
        commissionRate: rate,
        commissionAmount,
        isInternalInvestor: false
    };
}

// Create singleton instance
const teamService = new TeamManagementService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MEMBER_STATUS,
        TeamMember,
        TeamManagementService,
        calculateCommissionWithInternalCheck,
        teamService
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.TeamService = {
        MEMBER_STATUS,
        TeamMember,
        TeamManagementService,
        calculateCommissionWithInternalCheck,
        instance: teamService
    };
}
