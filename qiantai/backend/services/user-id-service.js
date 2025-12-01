/**
 * Providence User ID Generation Service
 * - Founding members: ID = 1
 * - New users: Random 8-digit IDs
 * - Referral link generation with embedded referrer ID
 */

// Configuration
const USER_ID_CONFIG = {
    FOUNDING_MEMBER_ID: 1,
    MIN_RANDOM_ID: 10000000,    // 8-digit minimum
    MAX_RANDOM_ID: 99999999,    // 8-digit maximum
    RESERVED_IDS: [1],          // Reserved for founding members
};

// In-memory storage for used IDs (in production, use database)
const usedIds = new Set([1]); // Founding member ID is always reserved

/**
 * Generate a random 8-digit user ID
 * @returns {number} Unique 8-digit user ID
 */
function generateRandomUserId() {
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (attempts < maxAttempts) {
        const randomId = Math.floor(
            Math.random() * (USER_ID_CONFIG.MAX_RANDOM_ID - USER_ID_CONFIG.MIN_RANDOM_ID + 1)
        ) + USER_ID_CONFIG.MIN_RANDOM_ID;
        
        if (!usedIds.has(randomId) && !USER_ID_CONFIG.RESERVED_IDS.includes(randomId)) {
            usedIds.add(randomId);
            return randomId;
        }
        attempts++;
    }
    
    throw new Error('Unable to generate unique user ID after maximum attempts');
}

/**
 * Check if ID is a founding member
 * @param {number} userId - User ID to check
 * @returns {boolean} True if founding member
 */
function isFoundingMember(userId) {
    return userId === USER_ID_CONFIG.FOUNDING_MEMBER_ID;
}

/**
 * Reserve a specific user ID
 * @param {number} userId - User ID to reserve
 * @returns {boolean} True if successfully reserved
 */
function reserveUserId(userId) {
    if (usedIds.has(userId)) {
        return false;
    }
    usedIds.add(userId);
    return true;
}

/**
 * Release a user ID (for testing or account deletion)
 * @param {number} userId - User ID to release
 * @returns {boolean} True if successfully released
 */
function releaseUserId(userId) {
    if (USER_ID_CONFIG.RESERVED_IDS.includes(userId)) {
        return false; // Cannot release reserved IDs
    }
    return usedIds.delete(userId);
}

/**
 * Generate referral/invite link
 * @param {number} referrerId - The referrer's user ID
 * @param {string} baseUrl - Base URL for the platform
 * @returns {Object} Referral link information
 */
function generateReferralLink(referrerId, baseUrl = 'https://providence.com') {
    // Generate invite code from user ID (can be user ID or encoded)
    const inviteCode = String(referrerId);
    
    // Multiple link formats supported
    const links = {
        // Standard link with query parameter
        standard: `${baseUrl}/register.html?code=${inviteCode}`,
        // Short link with invite parameter
        short: `${baseUrl}/r/${inviteCode}`,
        // Subdomain format (if supported)
        subdomain: `https://${inviteCode}.${baseUrl.replace(/^https?:\/\//, '')}`,
        // QR code compatible short URL
        qr: `${baseUrl}/i/${inviteCode}`
    };
    
    return {
        referrerId,
        inviteCode,
        links,
        primaryLink: links.standard,
        createdAt: new Date().toISOString()
    };
}

/**
 * Parse invite code from registration request
 * @param {Object} requestData - Request containing invite code
 * @returns {number|null} Referrer's user ID or null
 */
function parseInviteCode(requestData) {
    // Check various sources for invite code
    const sources = [
        requestData.invite_code,
        requestData.inviteCode,
        requestData.code,
        requestData.referrer,
        requestData.pid
    ];
    
    for (const source of sources) {
        if (source) {
            const parsed = parseInt(source, 10);
            if (!isNaN(parsed) && parsed > 0) {
                return parsed;
            }
        }
    }
    
    return null;
}

/**
 * Validate invite code
 * @param {string|number} inviteCode - Invite code to validate
 * @returns {Object} Validation result
 */
function validateInviteCode(inviteCode) {
    if (!inviteCode) {
        return { valid: false, error: '邀请码不能为空' };
    }
    
    const userId = parseInt(inviteCode, 10);
    
    if (isNaN(userId) || userId <= 0) {
        return { valid: false, error: '无效的邀请码格式' };
    }
    
    // Check if the user exists (in production, query database)
    // For now, accept any valid numeric code
    return { 
        valid: true, 
        referrerId: userId,
        isFoundingMember: isFoundingMember(userId)
    };
}

/**
 * Create new user with proper ID assignment
 * @param {Object} userData - User registration data
 * @param {boolean} isFounder - Whether this is a founding member
 * @returns {Object} Created user data with assigned ID
 */
function createUserWithId(userData, isFounder = false) {
    let userId;
    
    if (isFounder) {
        userId = USER_ID_CONFIG.FOUNDING_MEMBER_ID;
        if (usedIds.has(userId) && !USER_ID_CONFIG.RESERVED_IDS.includes(userId)) {
            throw new Error('Founding member ID already assigned');
        }
    } else {
        userId = generateRandomUserId();
    }
    
    // Parse invite code to get referrer
    const referrerId = parseInviteCode(userData);
    
    return {
        id: userId,
        uid: String(userId),
        ...userData,
        pid: referrerId || 0,
        invite_code: String(userId), // User's own invite code is their ID
        isFoundingMember: isFounder,
        createdAt: new Date().toISOString()
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        USER_ID_CONFIG,
        generateRandomUserId,
        isFoundingMember,
        reserveUserId,
        releaseUserId,
        generateReferralLink,
        parseInviteCode,
        validateInviteCode,
        createUserWithId
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.UserIdService = {
        generateRandomUserId,
        isFoundingMember,
        generateReferralLink,
        parseInviteCode,
        validateInviteCode,
        createUserWithId
    };
}
