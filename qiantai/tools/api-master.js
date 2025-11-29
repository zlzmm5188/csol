#!/usr/bin/env node
/**
 * API接口自动化检查和修复主程序
 * 整合所有功能
 */

import { main as autoFix } from './api-auto-fix.js';
import { scanAllPages } from './api-f12-scanner.js';
import { runAllTests } from './api-test-runner.js';

async function runAll() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Providence API 自动化检查和修复系统 v1.0            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const steps = [
    {
      name: '1. 自动检查和修复接口',
      func: () => {
        autoFix();
        return Promise.resolve();
      }
    },
    {
      name: '2. 扫描 F12 错误',
      func: scanAllPages,
    },
    {
      name: '3. 运行接口测试',
      func: runAllTests,
    },
  ];

  for (const step of steps) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(step.name);
    console.log('='.repeat(60));

    try {
      await step.func();
      console.log(`✅ ${step.name} 完成\n`);
    } catch (error) {
      console.error(`❌ ${step.name} 失败: ${error.message}\n`);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   所有检查完成！                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('api-master.js')) {
  runAll().catch(console.error);
}

export { runAll };
