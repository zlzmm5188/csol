import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const API_BASE = 'https://api.4kp3l0iq.top/api';
const TEST_PAGES = [
    'index.html',
    'login.html',
    'profile.html',
    'projects.html',
    'market.html',
    'recharge.html',
    'withdraw.html',
    'records.html',
    'ribao.html',
    'shop.html',
    'points-history.html',
    'vip-level.html',
    'set-pay-password.html',
    'my-investments.html',
    'invite-share.html',
    'bank-cards.html',
    'reset-password.html',
    'daily-checkin.html',
    'profit-calendar.html'
];

const results = {
    timestamp: new Date().toISOString(),
    totalPages: 0,
    testedPages: 0,
    errors: [],
    warnings: [],
    success: []
};

async function testPageAPI(pagePath, browser) {
    const page = await browser.newPage();
    const pageErrors = [];
    const apiCalls = [];
    const failedAPIs = [];

    // 监听网络请求
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/index.php/') || url.includes('/api/')) {
            try {
                const status = response.status();
                const contentType = response.headers()['content-type'] || '';

                if (contentType.includes('application/json')) {
                    const text = await response.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        // 不是JSON，跳过
                        return;
                    }

                    apiCalls.push({
                        url,
                        status,
                        code: data.code,
                        msg: data.msg,
                        method: response.request().method()
                    });

                    // 检查错误
                    if (status === 404) {
                        failedAPIs.push({
                            url,
                            error: '404 Not Found',
                            code: null,
                            msg: null
                        });
                    } else if (data.code === -1) {
                        failedAPIs.push({
                            url,
                            error: 'API返回code:-1',
                            code: data.code,
                            msg: data.msg
                        });
                    } else if (status >= 400 && status < 500) {
                        failedAPIs.push({
                            url,
                            error: `HTTP ${status}`,
                            code: data.code,
                            msg: data.msg
                        });
                    }
                } else if (status === 404) {
                    failedAPIs.push({
                        url,
                        error: '404 Not Found',
                        code: null,
                        msg: null
                    });
                }
            } catch (e) {
                // 忽略解析错误
            }
        }
    });

    // 监听控制台错误
    page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('API接口未定义') ||
            text.includes('404') ||
            text.includes('code:-1') ||
            text.includes('接口错误')) {
            pageErrors.push({
                type: msg.type(),
                text: text
            });
        }
    });

    // 监听页面错误
    page.on('pageerror', (error) => {
        if (error.message.includes('404') ||
            error.message.includes('API') ||
            error.message.includes('接口')) {
            pageErrors.push({
                type: 'pageerror',
                text: error.message
            });
        }
    });

    try {
        const fullUrl = `https://copla.top/${pagePath}`;
        console.log(`\n🔍 测试页面: ${pagePath}`);
        console.log(`   URL: ${fullUrl}`);

        await page.goto(fullUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // 等待页面加载完成
        await page.waitForTimeout(3000);

        // 尝试触发一些交互（如果需要）
        try {
            // 检查是否有登录表单
            const loginForm = await page.$('form');
            if (loginForm) {
                // 不填写表单，只等待
                await page.waitForTimeout(1000);
            }
        } catch (e) {
            // 忽略
        }

        // 汇总结果
        if (failedAPIs.length > 0 || pageErrors.length > 0) {
            results.errors.push({
                page: pagePath,
                url: fullUrl,
                failedAPIs: failedAPIs,
                pageErrors: pageErrors,
                totalAPICalls: apiCalls.length
            });
            console.log(`   ❌ 发现 ${failedAPIs.length} 个接口错误, ${pageErrors.length} 个页面错误`);
        } else if (apiCalls.length > 0) {
            results.success.push({
                page: pagePath,
                url: fullUrl,
                totalAPICalls: apiCalls.length,
                apis: apiCalls
            });
            console.log(`   ✅ 通过 (${apiCalls.length} 个API调用)`);
        } else {
            results.warnings.push({
                page: pagePath,
                url: fullUrl,
                message: '未检测到API调用'
            });
            console.log(`   ⚠️  警告: 未检测到API调用`);
        }

        results.testedPages++;
    } catch (error) {
        results.errors.push({
            page: pagePath,
            url: `https://copla.top/${pagePath}`,
            error: error.message,
            failedAPIs: failedAPIs,
            pageErrors: pageErrors
        });
        console.log(`   ❌ 页面加载失败: ${error.message}`);
    } finally {
        await page.close();
    }
}

async function runTests() {
    console.log('🚀 开始前端接口连通性测试...\n');
    console.log(`📋 测试页面数量: ${TEST_PAGES.length}`);
    console.log(`🌐 API基础地址: ${API_BASE}\n`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    results.totalPages = TEST_PAGES.length;

    for (const pagePath of TEST_PAGES) {
        await testPageAPI(pagePath, browser);
    }

    await browser.close();

    // 生成报告
    const report = {
        summary: {
            totalPages: results.totalPages,
            testedPages: results.testedPages,
            success: results.success.length,
            errors: results.errors.length,
            warnings: results.warnings.length
        },
        errors: results.errors,
        warnings: results.warnings,
        success: results.success
    };

    // 保存报告
    const reportPath = path.join(process.cwd(), 'docs', 'api-connectivity-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    // 输出摘要
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果摘要');
    console.log('='.repeat(60));
    console.log(`总页面数: ${results.totalPages}`);
    console.log(`已测试: ${results.testedPages}`);
    console.log(`✅ 成功: ${results.success.length}`);
    console.log(`❌ 错误: ${results.errors.length}`);
    console.log(`⚠️  警告: ${results.warnings.length}`);
    console.log(`\n📄 详细报告已保存: ${reportPath}`);

    if (results.errors.length > 0) {
        console.log('\n❌ 发现错误的页面:');
        results.errors.forEach((err, idx) => {
            console.log(`\n${idx + 1}. ${err.page}`);
            console.log(`   URL: ${err.url}`);
            if (err.failedAPIs && err.failedAPIs.length > 0) {
                console.log(`   接口错误 (${err.failedAPIs.length}个):`);
                err.failedAPIs.forEach(api => {
                    console.log(`     - ${api.url}`);
                    console.log(`       错误: ${api.error}`);
                    if (api.msg) console.log(`       消息: ${api.msg}`);
                });
            }
            if (err.pageErrors && err.pageErrors.length > 0) {
                console.log(`   页面错误 (${err.pageErrors.length}个):`);
                err.pageErrors.forEach(err => {
                    console.log(`     - ${err.text}`);
                });
            }
        });
    }

    return report;
}

// 执行测试
runTests().catch(console.error);
