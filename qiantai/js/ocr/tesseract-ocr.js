/**
 * Providence - 前端OCR识别模块
 * 使用Tesseract.js在浏览器本地识别证件
 * 数据不上传，100%隐私保护
 */

class ProvidenceOCR {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.isProcessing = false;
    }

    /**
     * 初始化OCR引擎（优化版：只用英文+数字，速度快10倍）
     */
    async initialize(onProgress) {
        if (this.isInitialized) return;

        try {
            console.log('[OCR] 初始化中...');

            // 只使用英文识别（身份证号只有数字和X，不需要中文）
            this.worker = await Tesseract.createWorker('eng', 1, {
                logger: (m) => {
                    console.log('[OCR]', m.status, Math.round(m.progress * 100) + '%');

                    // 回调进度
                    if (onProgress) {
                        let progressPercent = 0;
                        let statusText = '';

                        if (m.status === 'loading tesseract core') {
                            progressPercent = Math.round(m.progress * 30);
                            statusText = '加载识别引擎...';
                        } else if (m.status === 'initializing tesseract') {
                            progressPercent = 30 + Math.round(m.progress * 20);
                            statusText = '初始化引擎...';
                        } else if (m.status === 'loading language traineddata') {
                            progressPercent = 50 + Math.round(m.progress * 40);
                            statusText = '加载识别模型...';
                        } else if (m.status === 'initializing api') {
                            progressPercent = 90 + Math.round(m.progress * 10);
                            statusText = '准备就绪...';
                        } else if (m.status === 'recognizing text') {
                            progressPercent = Math.round(m.progress * 100);
                            statusText = '正在识别...';
                        }

                        onProgress(progressPercent, statusText);
                    }
                }
            });

            this.isInitialized = true;
            console.log('[OCR] ✅ 初始化完成');
        } catch (error) {
            console.error('[OCR] ❌ 初始化失败:', error);
            throw new Error('OCR引擎初始化失败: ' + error.message);
        }
    }

    /**
     * 识别身份证号码
     */
    async recognizeIDCard(imageFile, onProgress) {
        if (!this.isInitialized) {
            await this.initialize(onProgress);
        }

        if (this.isProcessing) {
            throw new Error('正在识别中，请稍候...');
        }

        this.isProcessing = true;

        try {
            console.log('[OCR] 开始识别身份证...');

            // 识别图片
            const { data: { text } } = await this.worker.recognize(imageFile, {
                logger: (m) => {
                    if (m.status === 'recognizing text' && onProgress) {
                        onProgress(Math.round(m.progress * 100), '正在识别...');
                    }
                }
            });

            console.log('[OCR] 原始识别结果:', text);

            // 提取身份证号码（18位数字）
            const idNumber = this.extractIDNumber(text);

            if (idNumber) {
                console.log('[OCR] ✅ 识别成功:', idNumber);
                return {
                    success: true,
                    idNumber: idNumber,
                    rawText: text
                };
            } else {
                console.log('[OCR] ⚠️ 未识别到身份证号');
                return {
                    success: false,
                    message: '未识别到身份证号码，请重新拍摄或手动输入',
                    rawText: text
                };
            }
        } catch (error) {
            console.error('[OCR] ❌ 识别失败:', error);
            return {
                success: false,
                message: '识别失败: ' + error.message
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 识别银行卡号
     */
    async recognizeBankCard(imageFile) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isProcessing) {
            throw new Error('正在识别中，请稍候...');
        }

        this.isProcessing = true;

        try {
            console.log('[OCR] 开始识别银行卡...');

            const { data: { text } } = await this.worker.recognize(imageFile);

            console.log('[OCR] 原始识别结果:', text);

            // 提取银行卡号（16-19位数字）
            const cardNumber = this.extractBankCardNumber(text);

            if (cardNumber) {
                console.log('[OCR] ✅ 识别成功:', cardNumber);
                return {
                    success: true,
                    cardNumber: cardNumber,
                    rawText: text
                };
            } else {
                console.log('[OCR] ⚠️ 未识别到银行卡号');
                return {
                    success: false,
                    message: '未识别到银行卡号，请重新拍摄或手动输入',
                    rawText: text
                };
            }
        } catch (error) {
            console.error('[OCR] ❌ 识别失败:', error);
            return {
                success: false,
                message: '识别失败: ' + error.message
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 提取身份证号码（18位）
     */
    extractIDNumber(text) {
        // 移除所有空格和特殊字符
        const cleanText = text.replace(/[\s\-_]/g, '');

        // 匹配18位身份证号（数字或X）
        const pattern = /[0-9]{17}[0-9X]/gi;
        const matches = cleanText.match(pattern);

        if (matches && matches.length > 0) {
            // 验证身份证号格式
            const idNumber = matches[0].toUpperCase();
            if (this.validateIDNumber(idNumber)) {
                return idNumber;
            }
        }

        return null;
    }

    /**
     * 提取银行卡号（16-19位）
     */
    extractBankCardNumber(text) {
        // 移除所有空格和特殊字符
        const cleanText = text.replace(/[\s\-_]/g, '');

        // 匹配16-19位数字
        const pattern = /[0-9]{16,19}/g;
        const matches = cleanText.match(pattern);

        if (matches && matches.length > 0) {
            // 返回第一个匹配的卡号
            return matches[0];
        }

        return null;
    }

    /**
     * 验证身份证号格式
     */
    validateIDNumber(idNumber) {
        if (!/^[0-9]{17}[0-9X]$/i.test(idNumber)) {
            return false;
        }

        // 验证校验码
        const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

        let sum = 0;
        for (let i = 0; i < 17; i++) {
            sum += parseInt(idNumber[i]) * weights[i];
        }

        const checkCode = checkCodes[sum % 11];
        return idNumber[17].toUpperCase() === checkCode;
    }

    /**
     * 销毁OCR引擎
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
            console.log('[OCR] 引擎已销毁');
        }
    }
}

// 创建全局实例
window.ProvidenceOCR = new ProvidenceOCR();

console.log('🎉 Providence OCR 模块已加载');
