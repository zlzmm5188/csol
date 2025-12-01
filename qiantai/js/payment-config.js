
// API响应兜底处理
function safeParseApiResponse(data) {
    const code = data.code || data.status || 0;
    const msg = data.msg || data.message || '系统异常';
    const payload = data.data || data.result || {};

    return {
        code: code,
        msg: msg,
        data: payload,
        success: code === 1 || code === 200
    };
}

/**
 * SevenPay 支付网关配置
 * 对接文档: https://sevenpay.lh.plus/merchants/#/api-document
 */

const PAYMENT_CONFIG = {
    // 商户信息
    merchantId: 'M1763172182',
    username: 'XY8888',
    merchantName: 'XY',
    apiKey: '3e4cbfb35a35787ccc98bd13027b4a02',
    defaultPassword: 'Aa123456',

    // API地址
    payGateway: 'https://sevenpay.lh.plus/index.php/pay/create',
    queryGateway: 'https://sevenpay.lh.plus/index.php/pay/query',
    merchantLogin: 'https://sevenpay.lh.plus/merchants',

    // 回调IP
    callbackIP: '23.94.207.16',

    // 支付通道配置
    channels: {
        wechat: {
            code: 'S02',
            name: '微信扫码',
            minAmount: 100,
            maxAmount: 3000
        },
        alipay: {
            code: 'S01',
            name: '支付宝小额原生',
            minAmount: 100,
            maxAmount: 20000
        }
    }
};

/**
 * 生成签名（MD5）
 * 根据 SevenPay 文档：MD5运算（小写）
 * @param {Object} params - 待签名参数
 * @returns {string} 签名字符串（小写MD5）
 */
function generateSign(params) {
    // 1. 排除sign字段，只处理非空参数
    const signParams = {};
    for (const key in params) {
        if (key !== 'sign' && params[key] !== undefined && params[key] !== null && params[key] !== '') {
            signParams[key] = params[key];
        }
    }

    // 2. 按键名ASCII码从小到大排序（字典序）
    const sortedKeys = Object.keys(signParams).sort();

    // 3. 拼接字符串：key1=value1&key2=value2&...&key=商户密钥
    let signStr = '';
    for (const key of sortedKeys) {
        signStr += `${key}=${signParams[key]}&`;
    }
    signStr += `key=${PAYMENT_CONFIG.apiKey}`;

    console.log('🔐 签名原始字符串:', signStr.replace(PAYMENT_CONFIG.apiKey, '***'));

    // 4. MD5加密（小写）- 根据文档要求
    if (typeof CryptoJS !== 'undefined') {
        const sign = CryptoJS.MD5(signStr).toString().toLowerCase();
        console.log('🔐 生成的签名:', sign);
        return sign;
    } else {
        console.error('❌ CryptoJS未加载，无法生成签名');
        throw new Error('MD5加密库未加载，请检查crypto-js库是否已引入');
    }
}

/**
 * 创建支付订单
 * @param {Object} params - 支付参数
 * @param {number} params.amount - 支付金额（元）- 文档明确说明所有金额单位均是元
 * @param {string} params.channel - 支付通道 (e.g., 'wechat', 'alipay')
 * @param {string} params.orderNo - 商户订单号
 * @param {string} params.notifyUrl - 回调地址
 * @param {string} params.returnUrl - 跳转地址
 * @returns {Promise<Object>} 支付结果
 */
async function createPayment(params) {
    const channelConfig = PAYMENT_CONFIG.channels[params.channel];
    if (!channelConfig) {
        throw new Error('无效的支付通道');
    }

    // 构建请求参数（根据 SevenPay 文档）
    // 文档：https://sevenpay.lh.plus/merchants/#/api-document
    // 重要：文档明确说明"所有金额单位均是元"
    const requestParams = {
        merchantCode: PAYMENT_CONFIG.merchantId,      // 商户号
        channelType: channelConfig.code,              // 通道类型（S01/S02）
        merchantOrderNo: params.orderNo,               // 商户订单号
        amount: parseFloat(params.amount).toFixed(2), // 金额（元，保留2位小数）
        notifyUrl: params.notifyUrl,                   // 通知地址
        returnUrl: params.returnUrl,                  // 跳转地址
        ip: params.ip || '',                          // 用户IP（必填）
        title: params.title || '充值订单',            // 订单标题（必填）
        describe: params.describe || '用户充值',      // 订单描述（必填）
        extraParam: params.extraParam || ''           // 扩展参数（可选）
    };

    // 生成签名
    requestParams.sign = generateSign(requestParams);

    console.log('📤 创建支付订单请求参数:', {
        ...requestParams,
        sign: '***' // 隐藏签名
    });

    try {
        // 先尝试表单格式（很多支付网关使用表单格式）
        let response;
        let result;

        try {
            const formData = new URLSearchParams();
            for (const key in requestParams) {
                formData.append(key, requestParams[key]);
            }

            console.log('📤 发送表单数据:', {
                merchantCode: requestParams.merchantCode,
                channelType: requestParams.channelType,
                merchantOrderNo: requestParams.merchantOrderNo,
                amount: requestParams.amount,
                ip: requestParams.ip,
                title: requestParams.title,
                describe: requestParams.describe,
                sign: '***'
            });

            // 调试：打印完整的表单数据字符串
            console.log('📤 表单数据字符串:', formData.toString());

            try {
                response = await fetch(PAYMENT_CONFIG.payGateway, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                });
            } catch (err) {
                console.error(err);
                if (typeof showToast === "function") showToast("网络异常，请稍后重试");
                return;
            }

            result = await response.json();
        } catch (formError) {
            // 如果表单格式失败，尝试JSON格式
            console.warn('⚠️ 表单格式请求失败，尝试JSON格式:', formError);

            try {
                response = await fetch(PAYMENT_CONFIG.payGateway, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestParams)
                });
                result = await response.json();
            } catch (err) {
                console.error(err);
                if (typeof showToast === "function") showToast("网络异常，请稍后重试");
            }
        }

        console.log('📥 创建支付订单响应:', result);
        console.log('📥 响应状态码:', response.status);
        console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));

        // 检查错误信息（根据文档：code=1成功，code=0失败）
        if (result.code !== 1) {
            const errorMsg = result.message || result.msg || '未知错误';
            console.error('❌ 支付订单创建失败:', errorMsg);
            console.error('❌ 完整响应:', result);
            console.error('⚠️ 完整请求参数（隐藏签名）:', {
                ...requestParams,
                sign: '***'
            });
        }

        return result;
    } catch (error) {
        console.error('❌ 创建支付订单API请求失败:', error);
        console.error('❌ 错误详情:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * 查询支付订单状态
 * @param {string} orderNo - 商户订单号
 * @returns {Promise<Object>} 查询结果
 */
async function queryPayment(orderNo) {
    // 根据文档，查询订单的参数可能不同，先使用通用参数
    const requestParams = {
        merchantCode: PAYMENT_CONFIG.merchantId,  // 商户号
        merchantOrderNo: orderNo                   // 商户订单号
    };

    // 生成签名
    requestParams.sign = generateSign(requestParams);

    console.log('📤 查询支付订单请求参数:', {
        ...requestParams,
        sign: '***' // 隐藏签名
    });

    try {
        // 使用表单格式查询
        const formData = new URLSearchParams();
        for (const key in requestParams) {
            formData.append(key, requestParams[key]);
        }

        const response = await fetch(PAYMENT_CONFIG.queryGateway, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        const result = await response.json();

        console.log('📥 查询支付订单响应:', result);

        return result;
    } catch (error) {
        console.error('❌ 查询支付订单API请求失败:', error);
        throw error;
    }
}

// 导出到全局
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
window.createPayment = createPayment;
window.queryPayment = queryPayment;

console.log('✅ 支付配置已加载:', {
    merchantId: PAYMENT_CONFIG.merchantId,
    channels: Object.keys(PAYMENT_CONFIG.channels)
});
