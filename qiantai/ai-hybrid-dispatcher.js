/**
 * Providence 混合AI调度器
 * 版本: 1.1 (修复：添加后端API调用支持)
 * 创建时间: 2025-11-17
 * 功能: 智能路由（规则引擎 vs OpenAI），统一入口
 */

const AI_HYBRID_DISPATCHER = {
  version: '1.1',
  name: 'Providence Hybrid AI Dispatcher',
  apiBase: (typeof AI_CONFIG !== 'undefined' && AI_CONFIG.backend && AI_CONFIG.backend.apiBase) ? AI_CONFIG.backend.apiBase : 'https://api.4kp3l0iq.top', // 后端API地址

  // 性能统计
  stats: {
    totalRequests: 0,
    rulesHandled: 0,
    openaiHandled: 0,
    knowledgeHandled: 0,
    backendHandled: 0,
    avgResponseTime: 0,
    errors: 0
  },

  /**
     * 获取用户Token - 已禁用
     */
  // getToken() {
  //     return localStorage.getItem('providence_token') || '';
  // },
  getToken() {
    return '';
  },

  /**
     * 调用后端AI接口
     */
  async callBackendAPI(userMessage, conversationId = '') {
    // const token = this.getToken();

    try {
      const response = await fetch(this.apiBase + '/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 'Token': token || '',
          // 'Authorization': token ? 'Bearer ' + token : ''
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId
        })
      });

      const data = await response.json();

      // 支持 code: 1 或 code: 200 的成功响应
      if ((data.code === 1 || data.code === 1 || data.code === 200) && data.data) {
        return {
          success: true,
          message: data.data.message || '',
          intent: data.data.intent || 'unknown',
          confidence: data.data.confidence || 0,
          actionButtons: data.data.actionButtons || [],
          conversation_id: data.data.conversation_id || conversationId,
          timestamp: data.data.timestamp || Date.now()
        };
      } else {
        throw new Error(data.message || data.msg || '后端API返回错误');
      }
    } catch (error) {
      console.error('[AI调度器] 后端API调用失败:', error);
      throw error;
    }
  },

  /**
   * 主处理函数 - 统一入口
   */
  async processMessage(userMessage, userData = null) {
    // 执行插件钩子：处理前
    if (window.AI_PLUGIN_SYSTEM) {
      userMessage = await window.AI_PLUGIN_SYSTEM.executeHook('beforeProcess', userMessage, userData) || userMessage;
    }

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
// console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1890ff'); // 性能优化：已注释
// console.log('%c🤖 AI调度器 - 处理新消息', 'color: #1890ff; font-weight: bold'); // 性能优化：已注释
// console.log('%c消息:', 'color: #666', userMessage); // 性能优化：已注释

      // 检查AI_CONFIG是否存在
      if (typeof AI_CONFIG === 'undefined') {
        console.error('❌ AI_CONFIG未定义');
        return {
          success: false,
          message: 'AI配置未加载，请刷新页面重试',
          error: 'AI_CONFIG undefined'
        };
      }

// console.log('%c模式:', 'color: #666', AI_CONFIG.mode); // 性能优化：已注释

      // 优先尝试调用后端API（如果配置启用）
      if (AI_CONFIG && AI_CONFIG.backend && AI_CONFIG.backend.enable !== false) {
        try {
// console.log('%c🌐 尝试调用后端API', 'color: #1890ff; font-weight: bold'); // 性能优化：已注释
          const backendResponse = await this.callBackendAPI(userMessage);
          this.stats.backendHandled++;
          this.updateStats(startTime);
          console.log('%c✅ 后端API处理成功', 'color: #52c41a; font-weight: bold');
// console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1890ff'); // 性能优化：已注释
          return this.formatResponse(backendResponse, 'backend');
        } catch (error) {
          console.warn('⚠️ 后端API调用失败，降级到本地处理:', error.message);
          // 如果后端API失败，尝试使用本地规则引擎
          try {
            return await this.handleWithRules(userMessage, userData);
          } catch (rulesError) {
            console.error('规则引擎也失败:', rulesError);
            // 最终降级：返回友好提示
            return {
              success: false,
              message: `😔 <strong>服务暂时不可用</strong><br><br>` +
                       `可能的原因：<br>` +
                       `• 服务器正在维护<br>` +
                       `• 网络连接不稳定<br>` +
                       `• 服务暂时繁忙<br><br>` +
                       `<strong>您可以：</strong><br>` +
                       `• 稍后重试<br>` +
                       `• 使用快捷按钮查询<br>` +
                       `• 联系人工客服<br><br>`,
              error: error.message,
              source: 'error',
              actionButtons: [
                { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
                { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
                { text: '🔄 刷新页面', onclick: "location.reload()", type: 'secondary' }
              ]
            };
          }
        }
      }

      // 1. 检查知识库（优先级高）
      if (AI_CONFIG.knowledge.enable && AI_CONFIG.knowledge.priority === 'high') {
        const knowledgeResponse = this.tryKnowledgeBase(userMessage);
        if (knowledgeResponse) {
          this.stats.knowledgeHandled++;
          this.updateStats(startTime);
          console.log('%c✅ 知识库命中', 'color: #52c41a; font-weight: bold');
          return this.formatResponse(knowledgeResponse, 'knowledge');
        }
      }

      // 2. 根据模式分发
      let response;
      switch (AI_CONFIG.mode) {
        case 'rules_only':
          response = await this.handleWithRules(userMessage, userData);
          break;

        case 'openai_only':
          response = await this.handleWithOpenAI(userMessage, userData);
          break;

        case 'hybrid':
        default:
          response = await this.handleHybrid(userMessage, userData);
          break;
      }

      this.updateStats(startTime);

      // 执行插件钩子：处理后
      if (window.AI_PLUGIN_SYSTEM) {
        response = await window.AI_PLUGIN_SYSTEM.executeHook('afterProcess', response, userMessage, userData) || response;
      }

// console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1890ff'); // 性能优化：已注释

      return response;

    } catch (error) {
      this.stats.errors++;
      console.error('❌ AI调度器错误:', error);

      // 详细错误日志（开发环境）
      if (AI_CONFIG && AI_CONFIG.debug) {
        console.error('错误详情:', {
          message: error.message,
          stack: error.stack,
          userMessage: userMessage?.substring(0, 50)
        });
      }

      // 尝试降级处理：使用规则引擎的未知意图处理
      try {
        if (typeof AI_SERVICE_LOCAL !== 'undefined' && AI_SERVICE_LOCAL.handleUnknown) {
          const fallbackResponse = await AI_SERVICE_LOCAL.handleUnknown(userMessage || '');
          if (fallbackResponse && fallbackResponse.message) {
            return this.formatResponse(fallbackResponse, 'fallback');
          }
        }
      } catch (fallbackError) {
        console.error('降级处理也失败:', fallbackError);
      }

      // 最终错误提示
      return {
        success: false,
        message: `😔 <strong>抱歉，我遇到了一些问题</strong><br><br>` +
                 `可能的原因：<br>` +
                 `• 网络连接不稳定<br>` +
                 `• 服务暂时繁忙<br>` +
                 `• 请求超时<br><br>` +
                 `<strong>建议：</strong><br>` +
                 `1. 检查网络连接<br>` +
                 `2. 稍后重试<br>` +
                 `3. 使用快捷按钮查询<br>` +
                 `4. 联系人工客服<br><br>` +
                 `<small style="color:#999">错误代码: ${error.name || 'UNKNOWN'}</small>`,
        error: error.message,
        source: 'error',
        actionButtons: [
          { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
          { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
          { text: '🔄 重试', onclick: "location.reload()", type: 'secondary' }
        ]
      };
    }
  },

  /**
     * 混合模式处理
     */
  async handleHybrid(userMessage, userData) {
    // 1. 使用增强规则引擎分析
    const intent = AI_RULES_ENGINE.identifyIntent(userMessage);
    const entities = AI_RULES_ENGINE.extractEntities(userMessage);

// console.log('%c📊 意图识别:', 'color: #faad14', intent); // 性能优化：已注释
// console.log('%c📦 实体提取:', 'color: #faad14', entities); // 性能优化：已注释

    // 2. 判断是否应该使用规则引擎
    const shouldUseRules = this.shouldUseRules(userMessage, intent, userData);

    if (shouldUseRules.decision) {
// console.log('%c⚙️ 使用规则引擎处理', 'color: #52c41a; font-weight: bold'); // 性能优化：已注释
// console.log('%c原因:', 'color: #666', shouldUseRules.reason); // 性能优化：已注释

      try {
        const response = await this.handleWithRules(userMessage, userData, intent, entities);
        return response;
      } catch (error) {
        console.warn('⚠️ 规则引擎处理失败，降级到OpenAI:', error);
        // 降级到OpenAI
        return await this.handleWithOpenAI(userMessage, userData);
      }
    } else {
// console.log('%c🤖 使用OpenAI处理', 'color: #1890ff; font-weight: bold'); // 性能优化：已注释
// console.log('%c原因:', 'color: #666', shouldUseRules.reason); // 性能优化：已注释

      return await this.handleWithOpenAI(userMessage, userData);
    }
  },

  /**
     * 规则引擎处理
     */
  async handleWithRules(userMessage, userData, intent = null, entities = null) {
    this.stats.rulesHandled++;

    // 如果没有传入intent，重新识别
    if (!intent) {
      intent = AI_RULES_ENGINE.identifyIntent(userMessage);
    }
    if (!entities) {
      entities = AI_RULES_ENGINE.extractEntities(userMessage);
    }

    // 调用原有的AI_SERVICE_LOCAL处理
    let response;
    if (typeof AI_SERVICE_LOCAL !== 'undefined' && AI_SERVICE_LOCAL.processMessage) {
      try {
        response = await AI_SERVICE_LOCAL.processMessage(userMessage);
        // 如果返回null或undefined，使用后端API
        if (!response || !response.message) {
          console.warn('⚠️ 规则引擎返回空响应，尝试后端API');
          try {
            const backendResponse = await this.callBackendAPI(userMessage);
            return this.formatResponse(backendResponse, 'backend');
          } catch (error) {
            console.error('后端API也失败:', error);
            response = {
              message: '抱歉，我暂时无法回答这个问题。请稍后重试。',
              actionButtons: []
            };
          }
        }
        } catch (error) {
          console.error('规则引擎处理错误:', error);
          // 降级到后端API
          try {
            const backendResponse = await this.callBackendAPI(userMessage);
            return this.formatResponse(backendResponse, 'backend');
          } catch (apiError) {
            console.error('后端API也失败:', apiError);
            // 使用未知意图处理作为最终降级
            if (typeof AI_SERVICE_LOCAL !== 'undefined' && AI_SERVICE_LOCAL.handleUnknown) {
              try {
                const fallbackResponse = await AI_SERVICE_LOCAL.handleUnknown(userMessage);
                if (fallbackResponse && fallbackResponse.message) {
                  return this.formatResponse(fallbackResponse, 'fallback');
                }
              } catch (fallbackError) {
                console.error('降级处理也失败:', fallbackError);
              }
            }
            response = {
              message: `😔 <strong>服务暂时不可用</strong><br><br>` +
                       `抱歉，所有AI服务都暂时无法响应。<br><br>` +
                       `<strong>建议：</strong><br>` +
                       `• 检查网络连接<br>` +
                       `• 稍后重试<br>` +
                       `• 使用快捷按钮<br>` +
                       `• 联系人工客服<br><br>`,
              actionButtons: [
                { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
                { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
                { text: '🔄 刷新页面', onclick: "location.reload()", type: 'secondary' }
              ]
            };
          }
        }
    } else {
      // 如果AI_SERVICE_LOCAL不存在，直接使用后端API
      console.warn('⚠️ AI_SERVICE_LOCAL未定义，使用后端API');
      try {
        const backendResponse = await this.callBackendAPI(userMessage);
        return this.formatResponse(backendResponse, 'backend');
      } catch (error) {
        console.error('后端API调用失败:', error);
        // 使用未知意图处理作为降级
        if (typeof AI_SERVICE_LOCAL !== 'undefined' && AI_SERVICE_LOCAL.handleUnknown) {
          try {
            const fallbackResponse = await AI_SERVICE_LOCAL.handleUnknown(userMessage);
            if (fallbackResponse && fallbackResponse.message) {
              return this.formatResponse(fallbackResponse, 'fallback');
            }
          } catch (fallbackError) {
            console.error('降级处理也失败:', fallbackError);
          }
        }
        response = {
          message: `😔 <strong>服务暂时不可用</strong><br><br>` +
                   `无法连接到AI服务，请稍后重试。<br><br>` +
                   `<strong>您可以：</strong><br>` +
                   `• 使用快捷按钮查询<br>` +
                   `• 刷新页面重试<br>` +
                   `• 联系人工客服<br><br>`,
          actionButtons: [
            { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
            { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
            { text: '🔄 刷新', onclick: "location.reload()", type: 'secondary' }
          ]
        };
      }
    }

    let finalResponse = this.formatResponse(response, 'rules', {
      intent: intent.type,
      confidence: intent.confidence,
      entities: entities
    });

    // 执行插件钩子：响应生成后
    if (window.AI_PLUGIN_SYSTEM) {
      finalResponse = await window.AI_PLUGIN_SYSTEM.executeHook('responseGenerated', finalResponse, userMessage, userData) || finalResponse;
    }

    return finalResponse;
  },

  /**
     * OpenAI处理
     */
  async handleWithOpenAI(userMessage, userData) {
    // 检查OpenAI是否配置
    if (!AI_OPENAI.isConfigured()) {
      console.warn('⚠️ OpenAI未配置，降级到规则引擎');
      return await this.handleWithRules(userMessage, userData);
    }

    this.stats.openaiHandled++;

    try {
      // 初始化OpenAI（如果还没初始化）
      if (!AI_OPENAI.config.apiKey) {
        AI_OPENAI.init(AI_CONFIG.openai.apiKey, {
          model: AI_CONFIG.openai.model,
          maxTokens: AI_CONFIG.openai.maxTokens,
          temperature: AI_CONFIG.openai.temperature
        });
      }

      // 调用OpenAI
      const aiResponse = await AI_OPENAI.callOpenAI(userMessage, userData);

      return this.formatResponse({
        message: aiResponse
      }, 'openai');

      } catch (error) {
        console.error('❌ OpenAI调用失败:', error);

        // 降级到规则引擎
        try {
          return await this.handleWithRules(userMessage, userData);
        } catch (rulesError) {
          console.error('规则引擎降级也失败:', rulesError);
          // 最终降级：返回友好提示
          return {
            success: false,
            message: `🤖 <strong>AI服务暂时不可用</strong><br><br>` +
                     `我正在尝试其他方式为您服务...<br><br>` +
                     `<strong>您可以：</strong><br>` +
                     `• 使用快捷按钮查询<br>` +
                     `• 稍后重试<br>` +
                     `• 联系人工客服<br><br>`,
            error: error.message,
            source: 'error',
            actionButtons: [
              { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
              { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
              { text: '👑 VIP等级', onclick: "quickAsk('VIP等级')", type: 'secondary' }
            ]
          };
        }
      }
  },

  /**
     * 尝试知识库
     */
  tryKnowledgeBase(userMessage) {
    if (typeof matchKnowledge !== 'function') {
      return null;
    }

    const knowledge = matchKnowledge(userMessage);
    if (knowledge) {
      return {
        message: knowledge.content,
        actionButtons: knowledge.buttons || []
      };
    }

    return null;
  },

  /**
     * 判断是否应该使用规则引擎
     */
  shouldUseRules(message, intent, userData) {
    // 1. 优先使用规则引擎的场景
    if (AI_CONFIG.hybrid.preferRules.includes(intent.type)) {
      return {
        decision: true,
        reason: '属于规则引擎优先处理的意图类型'
      };
    }

    // 2. 优先使用OpenAI的场景
    if (AI_CONFIG.hybrid.preferOpenAI.includes(intent.type)) {
      return {
        decision: false,
        reason: '属于OpenAI优先处理的意图类型'
      };
    }

    // 3. 检查置信度
    if (intent.confidence < AI_CONFIG.hybrid.fallbackThreshold) {
      return {
        decision: false,
        reason: `置信度过低 (${intent.confidence.toFixed(2)})`
      };
    }

    // 4. 检查消息长度
    if (message.length > AI_CONFIG.hybrid.messageLengthThreshold) {
      return {
        decision: false,
        reason: `消息过长 (${message.length}字符)`
      };
    }

    // 5. 检查复杂关键词
    const hasComplexKeyword = AI_CONFIG.hybrid.complexKeywords.some(
      keyword => message.includes(keyword)
    );
    if (hasComplexKeyword) {
      return {
        decision: false,
        reason: '包含复杂查询关键词'
      };
    }

    // 6. 检查是否包含多个问题
    const questionCount = (message.match(/[？?]/g) || []).length;
    if (questionCount > 1) {
      return {
        decision: false,
        reason: '包含多个问题'
      };
    }

    // 默认使用规则引擎
    return {
      decision: true,
      reason: '符合规则引擎处理条件'
    };
  },

  /**
     * 格式化响应
     */
  formatResponse(rawResponse, source, metadata = {}) {
    return {
      success: true,
      message: rawResponse.message || rawResponse.content,
      actionButtons: rawResponse.actionButtons || [],
      data: rawResponse.data || null,
      source: source, // 'backend', 'rules', 'openai', 'knowledge'
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        version: this.version
      }
    };
  },

  /**
     * 更新统计信息
     */
  updateStats(startTime) {
    const responseTime = Date.now() - startTime;

    // 计算平均响应时间
    const totalTime = this.stats.avgResponseTime * (this.stats.totalRequests - 1) + responseTime;
    this.stats.avgResponseTime = totalTime / this.stats.totalRequests;

    if (AI_CONFIG && AI_CONFIG.debug && AI_CONFIG.debug.logPerformance) {
// console.log('%c⏱️ 响应时间:', 'color: #faad14', responseTime + 'ms'); // 性能优化：已注释
// console.log('%c📊 平均响应:', 'color: #faad14', this.stats.avgResponseTime.toFixed(0) + 'ms'); // 性能优化：已注释
    }
  },

  /**
     * 获取统计信息
     */
  getStats() {
    const total = this.stats.totalRequests || 1;
    return {
      ...this.stats,
      rulesPercentage: ((this.stats.rulesHandled / total) * 100).toFixed(1) + '%',
      openaiPercentage: ((this.stats.openaiHandled / total) * 100).toFixed(1) + '%',
      knowledgePercentage: ((this.stats.knowledgeHandled / total) * 100).toFixed(1) + '%',
      backendPercentage: ((this.stats.backendHandled / total) * 100).toFixed(1) + '%',
      errorRate: ((this.stats.errors / total) * 100).toFixed(1) + '%',
      avgResponseTime: this.stats.avgResponseTime.toFixed(0) + 'ms'
    };
  },

  /**
     * 重置统计
     */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      rulesHandled: 0,
      openaiHandled: 0,
      knowledgeHandled: 0,
      backendHandled: 0,
      avgResponseTime: 0,
      errors: 0
    };
// console.log('🔄 统计信息已重置'); // 性能优化：已注释
  },

  /**
     * 测试模式（用于调试）
     */
  async test(message) {
// console.log('%c🧪 测试模式', 'color: #f5222d; font-size: 16px; font-weight: bold'); // 性能优化：已注释
// console.log('%c测试消息:', 'color: #666', message); // 性能优化：已注释

    if (AI_CONFIG) {
      AI_CONFIG.enableDebug();
    }

    const response = await this.processMessage(message, null);

// console.log('%c测试结果:', 'color: #52c41a; font-weight: bold'); // 性能优化：已注释
// console.log(response); // 性能优化：已注释
// console.log('%c统计信息:', 'color: #1890ff; font-weight: bold'); // 性能优化：已注释
// console.log(this.getStats()); // 性能优化：已注释

    return response;
  }
};

// 全局暴露
if (typeof window !== 'undefined') {
  window.AI_HYBRID_DISPATCHER = AI_HYBRID_DISPATCHER;

  // 统一的对外接口
  window.sendToAI = async (message, userData = null) => {
    try {
// console.log('%c[sendToAI] 开始处理', 'color: #1890ff; font-weight: bold', { message, userData }); // 性能优化：已注释

      // 检查 AI_HYBRID_DISPATCHER 是否存在
      if (!window.AI_HYBRID_DISPATCHER) {
        console.error('❌ AI_HYBRID_DISPATCHER 未定义');
        return {
          success: false,
          message: 'AI系统未初始化，请刷新页面重试'
        };
      }

      const result = await AI_HYBRID_DISPATCHER.processMessage(message, userData);
// console.log('%c[sendToAI] 处理完成', 'color: #52c41a; font-weight: bold', result); // 性能优化：已注释
      return result;
    } catch (error) {
      console.error('%c[sendToAI] 处理失败', 'color: #f5222d; font-weight: bold', error);
      return {
        success: false,
        message: '抱歉，AI服务暂时不可用 😔<br><br>错误信息：' + error.message,
        error: error.message
      };
    }
  };

  // 兼容旧接口
  window.sendMessageToAI = window.sendToAI;
}

// console.log('🎯 Providence混合AI调度器已加载 v' + AI_HYBRID_DISPATCHER.version); // 性能优化：已注释
