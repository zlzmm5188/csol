/**
 * 🌐 全局变量管理系统
 * 用途：统一管理跨页面共享的全局状态，避免未声明变量错误
 * 创建时间：2025-11-16
 */

window.AppGlobals = {
    // 用户认证相关
    token: null,
    userData: null,
    balance: null,

    // 页面状态
    currentPage: null,

    // Toast状态（用于ios-toast.js）
    toastState: null,

    // 手势控制
    gestureEnabled: true,

    // OCR相关（用于tesseract-ocr.js）
    OCRWorker: null,
    OCRBusy: false,
};

console.log('✅ AppGlobals 全局变量系统已初始化');
