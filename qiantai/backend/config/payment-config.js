/**
 * Providence Payment and Rebate Configuration
 * Dual Currency Payment System (RMB and USDT)
 * Rebate in USDT for all payment types
 */

// Payment Method Configuration
const PAYMENT_METHODS = {
    // RMB Payment Methods
    ALIPAY: {
        code: 'alipay',
        name: '支付宝',
        currency: 'CNY',
        minAmount: 100,
        maxAmount: 500000,
        feeRate: 0,              // No fee for deposit
        rebateCurrency: 'USDT', // Rebate paid in USDT
        enabled: true,
        icon: 'alipay.png',
        description: '支付宝快捷充值'
    },
    WECHAT: {
        code: 'wechat',
        name: '微信支付',
        currency: 'CNY',
        minAmount: 100,
        maxAmount: 500000,
        feeRate: 0,
        rebateCurrency: 'USDT',
        enabled: true,
        icon: 'wechat.png',
        description: '微信快捷充值'
    },
    BANK: {
        code: 'bank',
        name: '银行卡转账',
        currency: 'CNY',
        minAmount: 1000,
        maxAmount: 5000000,
        feeRate: 0,
        rebateCurrency: 'USDT',
        enabled: true,
        requiresProof: true,    // Requires upload of transfer proof
        icon: 'bank.png',
        description: '银行卡转账充值（需上传凭证）'
    },
    // USDT Payment Methods
    USDT_TRC20: {
        code: 'usdt_trc20',
        name: 'USDT-TRC20',
        currency: 'USDT',
        network: 'TRC20',
        minAmount: 10,
        maxAmount: 1000000,
        feeRate: 0,
        rebateCurrency: 'USDT',
        enabled: true,
        icon: 'usdt.png',
        description: 'USDT充值 (TRC20网络)'
    },
    USDT_ERC20: {
        code: 'usdt_erc20',
        name: 'USDT-ERC20',
        currency: 'USDT',
        network: 'ERC20',
        minAmount: 50,
        maxAmount: 1000000,
        feeRate: 0,
        rebateCurrency: 'USDT',
        enabled: true,
        icon: 'usdt.png',
        description: 'USDT充值 (ERC20网络)'
    }
};

// Rebate Configuration per VIP level
// RMB payments: rebate in USDT
// USDT payments: rebate in USDT
const REBATE_CONFIG = {
    // RMB Payment Rebate Rates (%)
    RMB: {
        VIP0: { rate: 0.1 },     // 0.1% rebate
        VIP1: { rate: 0.2 },     // 0.2% rebate
        VIP2: { rate: 0.3 },
        VIP3: { rate: 0.4 },
        VIP4: { rate: 0.5 },
        VIP5: { rate: 0.6 },
        VIP6: { rate: 0.7 },
        VIP7: { rate: 0.8 },
        VIP8: { rate: 1.0 }      // 1% rebate
    },
    // USDT Payment Rebate Rates (%)
    USDT: {
        VIP0: { rate: 0.15 },    // 0.15% rebate
        VIP1: { rate: 0.25 },
        VIP2: { rate: 0.35 },
        VIP3: { rate: 0.45 },
        VIP4: { rate: 0.55 },
        VIP5: { rate: 0.65 },
        VIP6: { rate: 0.75 },
        VIP7: { rate: 0.85 },
        VIP8: { rate: 1.1 }      // 1.1% rebate
    }
};

// Exchange Rate Configuration
let EXCHANGE_RATE_CONFIG = {
    USDT_CNY: 7.2,              // Default: 1 USDT = 7.2 CNY
    lastUpdated: new Date().toISOString(),
    source: 'manual'           // manual | api
};

/**
 * Set USDT exchange rate
 * @param {number} rate - Exchange rate (USDT to CNY)
 * @param {string} source - Rate source ('manual' or 'api')
 */
function setExchangeRate(rate, source = 'manual') {
    if (rate <= 0) {
        throw new Error('Exchange rate must be positive');
    }
    EXCHANGE_RATE_CONFIG = {
        USDT_CNY: rate,
        lastUpdated: new Date().toISOString(),
        source
    };
    return EXCHANGE_RATE_CONFIG;
}

/**
 * Get current exchange rate
 * @returns {Object} Exchange rate configuration
 */
function getExchangeRate() {
    return { ...EXCHANGE_RATE_CONFIG };
}

/**
 * Convert CNY to USDT
 * @param {number} cnyAmount - Amount in CNY
 * @returns {number} Amount in USDT
 */
function cnyToUsdt(cnyAmount) {
    return cnyAmount / EXCHANGE_RATE_CONFIG.USDT_CNY;
}

/**
 * Convert USDT to CNY
 * @param {number} usdtAmount - Amount in USDT
 * @returns {number} Amount in CNY
 */
function usdtToCny(usdtAmount) {
    return usdtAmount * EXCHANGE_RATE_CONFIG.USDT_CNY;
}

/**
 * Calculate rebate amount for a payment
 * @param {string} paymentCurrency - 'CNY' or 'USDT'
 * @param {number} paymentAmount - Payment amount
 * @param {number} vipLevel - VIP level (0-8)
 * @returns {Object} Rebate calculation result
 */
function calculateRebate(paymentCurrency, paymentAmount, vipLevel) {
    const vipKey = `VIP${vipLevel}`;
    const configKey = paymentCurrency === 'USDT' ? 'USDT' : 'RMB';
    const rebateConfig = REBATE_CONFIG[configKey][vipKey] || REBATE_CONFIG[configKey].VIP0;
    
    let rebateAmountUsdt;
    let paymentAmountCny;
    
    if (paymentCurrency === 'USDT') {
        // USDT payment: direct calculation
        rebateAmountUsdt = paymentAmount * rebateConfig.rate / 100;
        paymentAmountCny = usdtToCny(paymentAmount);
    } else {
        // CNY payment: convert to USDT for rebate
        paymentAmountCny = paymentAmount;
        const paymentInUsdt = cnyToUsdt(paymentAmount);
        rebateAmountUsdt = paymentInUsdt * rebateConfig.rate / 100;
    }
    
    return {
        paymentCurrency,
        paymentAmount,
        paymentAmountCny,
        vipLevel,
        rebateRate: rebateConfig.rate,
        rebateAmountUsdt: Math.round(rebateAmountUsdt * 100) / 100, // Round to 2 decimal places
        rebateAmountCny: Math.round(usdtToCny(rebateAmountUsdt) * 100) / 100,
        exchangeRate: EXCHANGE_RATE_CONFIG.USDT_CNY
    };
}

/**
 * Get payment method configuration
 * @param {string} methodCode - Payment method code
 * @returns {Object|null} Payment method configuration
 */
function getPaymentMethod(methodCode) {
    return Object.values(PAYMENT_METHODS).find(m => m.code === methodCode) || null;
}

/**
 * Get all enabled payment methods
 * @param {string} currency - Filter by currency (optional)
 * @returns {Array} Enabled payment methods
 */
function getEnabledPaymentMethods(currency = null) {
    return Object.values(PAYMENT_METHODS).filter(m => {
        if (!m.enabled) return false;
        if (currency && m.currency !== currency) return false;
        return true;
    });
}

/**
 * Validate payment amount
 * @param {string} methodCode - Payment method code
 * @param {number} amount - Payment amount
 * @returns {Object} Validation result
 */
function validatePaymentAmount(methodCode, amount) {
    const method = getPaymentMethod(methodCode);
    
    if (!method) {
        return { valid: false, error: '无效的支付方式' };
    }
    
    if (!method.enabled) {
        return { valid: false, error: '该支付方式暂不可用' };
    }
    
    if (amount < method.minAmount) {
        return { valid: false, error: `最低充值金额为 ${method.minAmount} ${method.currency}` };
    }
    
    if (amount > method.maxAmount) {
        return { valid: false, error: `最高充值金额为 ${method.maxAmount} ${method.currency}` };
    }
    
    return { valid: true, method };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PAYMENT_METHODS,
        REBATE_CONFIG,
        EXCHANGE_RATE_CONFIG,
        setExchangeRate,
        getExchangeRate,
        cnyToUsdt,
        usdtToCny,
        calculateRebate,
        getPaymentMethod,
        getEnabledPaymentMethods,
        validatePaymentAmount
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.PaymentConfig = {
        PAYMENT_METHODS,
        REBATE_CONFIG,
        setExchangeRate,
        getExchangeRate,
        cnyToUsdt,
        usdtToCny,
        calculateRebate,
        getPaymentMethod,
        getEnabledPaymentMethods,
        validatePaymentAmount
    };
}
