/**
 * 天气查询插件
 * 功能: 让AI可以查询天气信息
 */

(function() {
    'use strict';

    const WeatherPlugin = {
        name: 'weather',
        version: '1.0.0',
        description: '天气查询插件 - 让AI可以查询天气信息',

        init(pluginSystem) {
            console.log('[天气插件] ✅ 初始化完成');
        },

        hooks: {
            // 意图识别钩子 - 检测天气相关意图
            intentDetected: async (intent, userMessage) => {
                const weatherKeywords = ['天气', '温度', '下雨', '晴天', '阴天', 'weather', 'temperature'];
                const hasWeatherKeyword = weatherKeywords.some(keyword =>
                    userMessage.toLowerCase().includes(keyword.toLowerCase())
                );

                if (hasWeatherKeyword && intent.type === 'unknown') {
                    return {
                        type: 'weather_query',
                        confidence: 0.8,
                        entities: {
                            location: this.extractLocation(userMessage)
                        }
                    };
                }

                return intent;
            },

            // 响应生成钩子 - 处理天气查询
            responseGenerated: async (response, userMessage, userData) => {
                if (userMessage.match(/天气|温度|下雨|晴天|阴天/i)) {
                    const location = this.extractLocation(userMessage) || '北京';
                    const weather = await this.getWeather(location);

                    if (weather) {
                        return {
                            ...response,
                            message: `🌤️ <strong>${location}天气</strong><br><br>` +
                                   `温度：${weather.temp}°C<br>` +
                                   `天气：${weather.condition}<br>` +
                                   `湿度：${weather.humidity}%<br>` +
                                   `风速：${weather.windSpeed} km/h<br><br>` +
                                   `💡 温馨提示：${weather.tip}`,
                            source: 'weather_plugin'
                        };
                    }
                }

                return response;
            }
        },

        // 提取地点
        extractLocation(message) {
            const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
            for (const city of cities) {
                if (message.includes(city)) {
                    return city;
                }
            }
            return null;
        },

        // 获取天气（模拟数据，实际应该调用天气API）
        async getWeather(location) {
            // 这里可以集成真实的天气API，比如：
            // - 和风天气 API
            // - OpenWeatherMap API
            // - 高德天气 API

            // 模拟数据
            const weathers = {
                '北京': { temp: 15, condition: '多云', humidity: 65, windSpeed: 12, tip: '天气不错，适合外出~' },
                '上海': { temp: 18, condition: '晴', humidity: 70, windSpeed: 10, tip: '阳光明媚，心情也会很好哦~' },
                '广州': { temp: 25, condition: '晴', humidity: 75, windSpeed: 8, tip: '天气温暖，注意防晒~' },
                '深圳': { temp: 26, condition: '多云', humidity: 80, windSpeed: 9, tip: '湿度较高，注意防潮~' }
            };

            // 模拟API延迟
            await new Promise(resolve => setTimeout(resolve, 300));

            return weathers[location] || weathers['北京'];
        }
    };

    // 注册插件
    if (typeof window !== 'undefined' && window.AI_PLUGIN_SYSTEM) {
        window.AI_PLUGIN_SYSTEM.register('weather', WeatherPlugin);
    } else {
        // 延迟注册
        window.addEventListener('load', () => {
            if (window.AI_PLUGIN_SYSTEM) {
                window.AI_PLUGIN_SYSTEM.register('weather', WeatherPlugin);
            }
        });
    }
})();
