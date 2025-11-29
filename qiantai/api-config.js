/**
 * 🔧 Providence 前台API配置文件
 * 本地开发环境配置 - 指向本地后台API服务器
 *
 * ⚠️ 生产环境注意：
 * 此文件仅在开发环境使用，生产环境应使用 config.js 或 api-new.js
 * 如果 window.API_CONFIG 已存在，此文件不会覆盖（保护生产配置）
 */

// ✅ 只在未配置时才设置（保护生产环境配置）
if (!window.API_CONFIG || !window.API_CONFIG.baseURL) {
  // 检查是否为开发环境（通过URL判断）
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168') ||
                       window.location.port === '8080' ||
                       window.location.port === '8082';

  if (isDevelopment) {
    // ✅ 本地测试环境配置
    window.API_CONFIG = {
      // 后台API基础地址（不包含/api，避免路径重复）
      baseURL: 'http://localhost:8082',

      // API超时时间（毫秒）
      timeout: 30000,

      // 调试模式
      debug: true,

      // 系统版本
      version: '1.0.0-local',

      // 环境标识
      env: 'development',

      // 更新时间
      updated: new Date().toISOString()
    };

    // 日志输出（仅开发环境）
    console.log('✅ [开发环境] API配置已加载');
    console.log('📍 API基础地址:', window.API_CONFIG.baseURL);
    console.log('🔍 调试模式:', window.API_CONFIG.debug);
  } else {
    // 生产环境：不设置，使用 config.js 或 api-new.js 的配置
    console.log('ℹ️ [生产环境] 跳过 api-config.js，使用生产配置');
  }
} else {
  // 配置已存在，不覆盖
  console.log('ℹ️ API配置已存在，跳过 api-config.js');
}
