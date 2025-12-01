/**
 * DeepSeek AI Service
 * Provides AI capabilities for customer support, code generation, and more
 */

import config from '../config/index.js';

class DeepSeekService {
  constructor() {
    this.apiKey = config.deepseek.apiKey;
    this.baseUrl = config.deepseek.baseUrl;
    this.model = config.deepseek.model;
    this.maxTokens = config.deepseek.maxTokens;
    this.temperature = config.deepseek.temperature;
  }

  /**
   * Send a chat completion request to DeepSeek API
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async chatCompletion(messages, options = {}) {
    const requestBody = {
      model: options.model || this.model,
      messages: messages,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature ?? this.temperature,
      stream: false
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage || {},
        raw: data
      };
    } catch (error) {
      console.error('[DeepSeek] API call failed:', error);
      return {
        success: false,
        error: error.message,
        content: ''
      };
    }
  }

  /**
   * Generate SQL query from natural language
   * @param {string} naturalQuery - Natural language description
   * @param {string} schema - Database schema description
   * @returns {Promise<Object>} - Generated SQL query
   */
  async generateSQL(naturalQuery, schema = '') {
    const systemPrompt = `You are an expert SQL assistant. Convert natural language queries to SQL.
${schema ? `Database schema:\n${schema}\n` : ''}
Rules:
1. Only generate SELECT, SHOW, DESCRIBE, or EXPLAIN queries for safety
2. Never generate queries that modify data (INSERT, UPDATE, DELETE, DROP, etc.)
3. Return only the SQL query without explanations
4. If the request would require data modification, explain why you cannot do it`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: naturalQuery }
    ];

    return await this.chatCompletion(messages, { temperature: 0.3 });
  }

  /**
   * Generate code in specified language
   * @param {string} description - Code requirement description
   * @param {string} language - Programming language
   * @returns {Promise<Object>} - Generated code
   */
  async generateCode(description, language = 'javascript') {
    const systemPrompt = `You are an expert programmer. Generate clean, efficient, and well-documented ${language} code.
Rules:
1. Include helpful comments explaining the logic
2. Follow best practices and coding standards for ${language}
3. Handle edge cases and errors appropriately
4. Return only the code wrapped in appropriate code blocks`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description }
    ];

    return await this.chatCompletion(messages, { temperature: 0.4 });
  }

  /**
   * Review and fix code
   * @param {string} code - Code to review
   * @param {string} language - Programming language
   * @param {string} instruction - Specific review instruction
   * @returns {Promise<Object>} - Review result with suggestions
   */
  async reviewCode(code, language = 'javascript', instruction = '') {
    const systemPrompt = `You are an expert code reviewer. Analyze the provided ${language} code and provide:
1. Identified issues (bugs, security vulnerabilities, performance problems)
2. Suggestions for improvement
3. Fixed version of the code if needed
${instruction ? `Additional instruction: ${instruction}` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`` }
    ];

    return await this.chatCompletion(messages, { temperature: 0.3 });
  }

  /**
   * AI Customer Support - Handle user queries
   * @param {string} query - User's question
   * @param {Object} userContext - User context information
   * @returns {Promise<Object>} - AI response with intent detection
   */
  async customerSupport(query, userContext = {}) {
    const systemPrompt = `You are a helpful customer support AI assistant for Providence Financial Platform.
Available features: Investment products, Daily earnings (Ribao), Recharge/Withdraw, Team bonuses, VIP levels, KYC verification

User Context:
- VIP Level: ${userContext.vipLevel || 'Unknown'}
- Balance: ${userContext.balance || 'Unknown'}
- KYC Status: ${userContext.kycStatus || 'Unknown'}

Respond helpfully and professionally. If you need to perform an action, indicate the intent clearly.
Available intents: CHECK_BALANCE, VIEW_INVESTMENTS, RECHARGE_HELP, WITHDRAW_HELP, KYC_STATUS, VIP_INFO, TEAM_INFO, PRODUCT_INFO, GENERAL_HELP`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ];

    const result = await this.chatCompletion(messages, { temperature: 0.6 });

    // Extract intent from response
    const intentMatch = result.content.match(/Intent:\s*(\w+)/i);
    result.intent = intentMatch ? intentMatch[1] : 'GENERAL_HELP';

    return result;
  }
}

// Export singleton instance
const deepSeekService = new DeepSeekService();
export default deepSeekService;
export { DeepSeekService };
