/**

// 防止事件监听器重复注册
function addEventListenerOnce(element, event, handler, options) {
    if (!element) return;
    if (!element._bindedEvents) element._bindedEvents = {};
    const key = event + '_' + (handler.name || 'anonymous');
    if (!element._bindedEvents[key]) {
        element._bindedEvents[key] = true;
        element.addEventListener(event, handler, options || { passive: false });
    }
}


 * 发送页面标题到父窗口（app.html）
 * 并隐藏页面自身的标题栏
 */
(function() {
    'use strict';

    // 页面标题映射表
    const PAGE_TITLES = {
        'index.html': 'PROVIDENCE',  // 首页固定显示PROVIDENCE
        'company-news.html': '公司动态',
        'company-news-detail.html': '动态详情',
        'news-flash.html': '快讯',
        'news.html': '资讯',
        'news-detail.html': '资讯详情',
        'messages.html': 'Providence AI',
        'message-chat.html': 'AI对话',
        'education.html': '投资学堂',
        'education-detail.html': '课程详情',
        'market.html': '市场数据',
        'market-detail.html': '数据详情',
        'calendar.html': '财经日历',
        'policy.html': '监管政策',
        'policy-detail-1.html': '政策详情',
        'policy-detail-2.html': '政策详情',
        'policy-detail-3.html': '政策详情',
        'policy-detail-4.html': '政策详情',
        'policy-detail-5.html': '政策详情',
        'policy-detail-6.html': '政策详情',
        'policy-detail-7.html': '政策详情',
        'policy-detail-8.html': '政策详情',
        'policy-detail-9.html': '政策详情',
        'policy-detail-10.html': '政策详情',
        'policy-detail-11.html': '政策详情',
        'policy-detail-12.html': '政策详情',
        'policy-detail-13.html': '政策详情',
        'policy-detail-14.html': '政策详情',
        'policy-detail-15.html': '政策详情',
        'policy-detail-16.html': '政策详情',
        'policy-detail-17.html': '政策详情',
        'policy-detail-18.html': '政策详情',
        'policy-detail-19.html': '政策详情',
        'policy-detail-20.html': '政策详情',
        'policy-detail-21.html': '政策详情',
        'policy-detail-22.html': '政策详情',
        'policy-detail-23.html': '政策详情',
        'policy-detail-24.html': '政策详情',
        'guide.html': '新手指南',
        'guide-advisor.html': '智能顾问',
        'brokers.html': '券商合作',
        'lawyer-team.html': '律师团队',
        'shop.html': '积分商城',
        'shop-item-detail.html': '商品详情',
        'points-exchange.html': '积分兑换',
        'points-exchange-history.html': '兑换记录',
        'ribao.html': '日利宝',
        'ribao-history.html': '收益记录',
        'my-investments.html': '我的投资',
        'team-rewards.html': '团队奖励',
        'profit-calendar.html': '收益日历',
        'daily-checkin.html': '每日签到',
        'reward-rules.html': '奖励规则',
        'vip-benefits.html': 'VIP权益',
        'withdraw.html': '提现',
        'recharge.html': '充值',
        'set-pay-password.html': '设置支付密码',
        'finance.html': '理财',
        'project-detail.html': '项目详情',
        'project-detail-tailwind.html': '项目详情',
        'project-managers.html': '基金经理',
        'zone-detail.html': '专区详情',
        'trial-money.html': '体验金'
    };

    // 获取页面标题
    // 优先级：1. <title> 标签 > 2. data-title 属性 > 3. 映射表 > 4. 文件名推断
    function getPageTitle() {
        // 1. 优先从 <title> 标签获取
        const titleTag = document.querySelector('title');
        if (titleTag) {
            let title = titleTag.textContent.trim();
            // 移除常见的后缀（包括"智能投资平台"等）
            title = title.replace(/\s*[|·-]\s*PROVIDENCE.*$/i, '');
            title = title.replace(/\s*[|·-]\s*Providence.*$/i, '');
            title = title.replace(/\s*-\s*智能投资平台.*$/i, '');
            title = title.replace(/\s*智能投资平台.*$/i, '');
            // 如果清理后只剩下"Providence"，返回"PROVIDENCE"
            if (title.trim().toLowerCase() === 'providence') {
                return 'PROVIDENCE';
            }
            if (title && title.trim() !== '') {
                return title.trim();
            }
        }

        // 2. 从 data-title 属性获取（body 或 html 标签）
        const bodyDataTitle = document.body?.getAttribute('data-title');
        const htmlDataTitle = document.documentElement?.getAttribute('data-title');
        if (bodyDataTitle && bodyDataTitle.trim() !== '') {
            return bodyDataTitle.trim();
        }
        if (htmlDataTitle && htmlDataTitle.trim() !== '') {
            return htmlDataTitle.trim();
        }

        // 3. 从映射表获取
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop();
        if (PAGE_TITLES[fileName]) {
            return PAGE_TITLES[fileName];
        }

        // 4. 从页面中的标题元素获取（备用）
        const titleElement = document.querySelector('h1, .page-title, .topbar-title h1, .hero-title');
        if (titleElement) {
            const text = titleElement.textContent.trim();
            if (text && text !== '') {
                return text;
            }
        }

        // 5. 文件名推断（移除扩展名，首字母大写）
        if (fileName && fileName !== 'index.html') {
            const nameWithoutExt = fileName.replace(/\.html?$/, '');
            if (nameWithoutExt) {
                // 简单的文件名转标题（如：company-news -> Company News）
                return nameWithoutExt
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        }

        // 默认返回
        return 'PROVIDENCE';
    }

    // 发送标题到父窗口
    function sendTitleToParent() {
        if (window.parent && window.parent !== window) {
            const title = getPageTitle();
            const currentPath = window.location.pathname;
            const fileName = currentPath.split('/').pop();

            // 检查是否需要显示实时更新状态
            const needsLiveStatus = ['market.html', 'news-flash.html', 'company-news.html'].includes(fileName);

            window.parent.postMessage({
                type: 'setTitle',
                title: title,
                liveStatus: needsLiveStatus
            }, '*');
            console.log('📤 已发送标题到父窗口:', title, needsLiveStatus ? '(带实时更新)' : '');
        }
    }

    // 删除页面自身的标题栏（因为有app.html的标题栏代替）
    function removePageTitleBar() {
        // profile 页面不允许删除自己的 header.hero（包含四个毛玻璃卡片）
        if (window.location.pathname.includes('profile.html')) {
            console.log('✅ profile.html 保留 header.hero，不删除');
            return; // 不删除个人中心的 header
        }

        // 删除常见的标题栏元素
        const selectors = [
            '.topbar',
            '.hero-simple',
            '.detail-header',
            '.page-header',
            '.header-title',
            'header.hero .hero-top' // 首页的会动标题
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.remove(); // 直接删除DOM元素
            });
        });
    }

    // 监听父窗口的标题请求
    window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'requestTitle') {
            sendTitleToParent();
        }
    });

    // 页面加载完成后立即发送标题
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            sendTitleToParent();
            removePageTitleBar();
        });
    } else {
        sendTitleToParent();
        removePageTitleBar();
    }

    // 延迟再次发送（确保动态内容已加载）
    setTimeout(function() {
        sendTitleToParent();
        removePageTitleBar(); // 确保删除
    }, 500);
})();
