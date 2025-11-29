/**
 * Providence AI 插件系统
 * 版本: 1.0
 * 功能: 支持插件扩展，让AI功能更强大
 */

const AI_PLUGIN_SYSTEM = {
    version: '1.0',
    name: 'Providence AI Plugin System',

    // 已注册的插件
    plugins: {},

    // 插件钩子（hooks）
    hooks: {
        beforeProcess: [],      // 处理前钩子
        afterProcess: [],        // 处理后钩子
        intentDetected: [],      // 意图识别钩子
        responseGenerated: []    // 响应生成钩子
    },

    /**
     * 注册插件
     * @param {string} name - 插件名称
     * @param {Object} plugin - 插件对象
     */
    register(name, plugin) {
        if (!name || !plugin) {
            console.error('[插件系统] ❌ 插件名称和对象不能为空');
            return false;
        }

        // 验证插件结构
        if (typeof plugin.init !== 'function') {
            console.warn(`[插件系统] ⚠️ 插件 "${name}" 缺少 init 方法`);
        }

        // 注册插件
        this.plugins[name] = {
            name: name,
            ...plugin,
            enabled: plugin.enabled !== false,  // 默认启用
            registeredAt: new Date().toISOString()
        };

        // 初始化插件
        if (typeof plugin.init === 'function') {
            try {
                plugin.init(this);
                console.log(`[插件系统] ✅ 插件 "${name}" 注册成功`);
            } catch (error) {
                console.error(`[插件系统] ❌ 插件 "${name}" 初始化失败:`, error);
                this.plugins[name].enabled = false;
            }
        }

        // 注册钩子
        if (plugin.hooks) {
            Object.keys(plugin.hooks).forEach(hookName => {
                if (this.hooks[hookName] && Array.isArray(this.hooks[hookName])) {
                    this.hooks[hookName].push({
                        plugin: name,
                        handler: plugin.hooks[hookName]
                    });
                    console.log(`[插件系统] ✅ 插件 "${name}" 注册钩子: ${hookName}`);
                }
            });
        }

        return true;
    },

    /**
     * 卸载插件
     */
    unregister(name) {
        if (!this.plugins[name]) {
            console.warn(`[插件系统] ⚠️ 插件 "${name}" 不存在`);
            return false;
        }

        // 移除钩子
        Object.keys(this.hooks).forEach(hookName => {
            this.hooks[hookName] = this.hooks[hookName].filter(
                hook => hook.plugin !== name
            );
        });

        // 调用插件清理方法
        if (typeof this.plugins[name].destroy === 'function') {
            try {
                this.plugins[name].destroy();
            } catch (error) {
                console.error(`[插件系统] ❌ 插件 "${name}" 清理失败:`, error);
            }
        }

        delete this.plugins[name];
        console.log(`[插件系统] ✅ 插件 "${name}" 已卸载`);
        return true;
    },

    /**
     * 启用/禁用插件
     */
    toggle(name, enabled) {
        if (!this.plugins[name]) {
            console.warn(`[插件系统] ⚠️ 插件 "${name}" 不存在`);
            return false;
        }

        this.plugins[name].enabled = enabled;
        console.log(`[插件系统] ${enabled ? '✅' : '❌'} 插件 "${name}" ${enabled ? '已启用' : '已禁用'}`);
        return true;
    },

    /**
     * 执行钩子
     */
    async executeHook(hookName, ...args) {
        if (!this.hooks[hookName] || !Array.isArray(this.hooks[hookName])) {
            return args[0]; // 返回第一个参数
        }

        let result = args[0];

        for (const hook of this.hooks[hookName]) {
            // 检查插件是否启用
            if (!this.plugins[hook.plugin] || !this.plugins[hook.plugin].enabled) {
                continue;
            }

            try {
                if (typeof hook.handler === 'function') {
                    result = await hook.handler(result, ...args.slice(1)) || result;
                }
            } catch (error) {
                console.error(`[插件系统] ❌ 钩子 "${hookName}" 执行失败 (插件: ${hook.plugin}):`, error);
            }
        }

        return result;
    },

    /**
     * 获取所有插件
     */
    getPlugins() {
        return Object.keys(this.plugins).map(name => ({
            name: name,
            enabled: this.plugins[name].enabled,
            version: this.plugins[name].version || '1.0.0',
            description: this.plugins[name].description || '无描述'
        }));
    },

    /**
     * 获取插件信息
     */
    getPlugin(name) {
        return this.plugins[name] || null;
    }
};

// 暴露到全局
if (typeof window !== 'undefined') {
    window.AI_PLUGIN_SYSTEM = AI_PLUGIN_SYSTEM;
}

console.log('🔌 AI插件系统已加载 v' + AI_PLUGIN_SYSTEM.version);
