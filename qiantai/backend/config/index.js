/**
 * Backend Configuration
 * Centralized configuration for all backend services
 */

const config = {
  // DeepSeek API Configuration
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS, 10) || 4096,
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE) || 0.7
  },

  // Telegram Bot Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    adminChatIds: (process.env.TELEGRAM_ADMIN_CHAT_IDS || '').split(',').filter(Boolean)
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'providence'
  },

  // SSH Configuration (for DevOps bot)
  ssh: {
    enabled: process.env.SSH_ENABLED === 'true',
    allowedHosts: (process.env.SSH_ALLOWED_HOSTS || '').split(',').filter(Boolean),
    maxCommandLength: parseInt(process.env.SSH_MAX_COMMAND_LENGTH, 10) || 1000
  },

  // Currency Exchange Rates
  exchange: {
    usdtToRmbRate: parseFloat(process.env.USDT_TO_RMB_RATE) || 7.2,
    updateInterval: parseInt(process.env.EXCHANGE_UPDATE_INTERVAL, 10) || 3600000 // 1 hour
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'providence-secret-key',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    sqlQueryWhitelist: ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN'],
    sqlQueryBlacklist: ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE']
  },

  // Code Generation
  codeGen: {
    supportedLanguages: ['python', 'php', 'javascript', 'typescript', 'go', 'java', 'sql'],
    maxCodeLength: parseInt(process.env.MAX_CODE_LENGTH, 10) || 10000
  }
};

export default config;
