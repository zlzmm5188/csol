// 生成策略模板脚本
// 用于批量生成≥100条策略模板

const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '../content/strategy-templates');

// 模板生成配置
const categories = {
  bond: {
    names: ['固收', '可转债', '债券', '低波动', '稳健增值'],
    riskStyles: ['lowdd', 'balanced'],
    keywords: ['低回撤', '择券池', '量化', '对冲', '纪律化', '稳健']
  },
  ipo: {
    names: ['IPO配售', '新股申购', '精选项目', '价值发现'],
    riskStyles: ['balanced', 'aggressive'],
    keywords: ['纪律化', '专业投研', '精选', '组合管理', '价值发现']
  },
  fund: {
    names: ['基金组合', '固收增强', '资产配置', '多策略'],
    riskStyles: ['lowdd', 'balanced'],
    keywords: ['组合优化', '资产配置', '稳健增值', '分散风险']
  }
};

// 生成模板
function generateTemplate(category, index, variant) {
  const config = categories[category];
  const name = config.names[index % config.names.length];
  const riskStyle = config.riskStyles[index % config.riskStyles.length];
  const keyword = config.keywords[index % config.keywords.length];

  const key = `${category}_${riskStyle}_${index}`;
  const title = `${name}·${variant}策略`;

  const bodyMd = `本策略专注于**${name}**领域的${variant}投资，通过专业团队管理与风险控制，追求长期稳定回报。

- 核心逻辑：${keyword}为核心驱动，结合市场环境动态调整
- 风险控制：目标最大回撤控制在合理区间
- 收益目标：在投资周期内追求稳健增值`;

  return {
    key,
    title,
    language: 'zh-CN',
    category,
    tags: `${keyword},${name},${variant}`,
    bodyMd,
    variants: [
      {
        variantKey: 'A',
        weight: 2,
        bodyMd: `采用**${variant}A**策略：通过${keyword}方法，在控制风险的前提下追求超额收益。`
      },
      {
        variantKey: 'B',
        weight: 1,
        bodyMd: `采用**${variant}B**策略：更注重长期价值与稳定复利，通过组合优化降低波动。`
      }
    ]
  };
}

// 生成所有模板
function generateAll() {
  const variants = ['纪律化', '量化', '精选', '增强', '优化'];
  let count = 0;

  Object.keys(categories).forEach(category => {
    for (let i = 0; i < 35; i++) {
      const variant = variants[i % variants.length];
      const template = generateTemplate(category, i, variant);
      const filename = `${template.key}.yaml`;
      const filepath = path.join(templatesDir, filename);

      const yaml = `key: ${template.key}
title: ${template.title}
language: ${template.language}
category: ${template.category}
tags: ${template.tags}
bodyMd: |
${template.bodyMd.split('\n').map(line => '  ' + line).join('\n')}

variants:
  - variantKey: ${template.variants[0].variantKey}
    weight: ${template.variants[0].weight}
    bodyMd: |
${template.variants[0].bodyMd.split('\n').map(line => '      ' + line).join('\n')}
  - variantKey: ${template.variants[1].variantKey}
    weight: ${template.variants[1].weight}
    bodyMd: |
${template.variants[1].bodyMd.split('\n').map(line => '      ' + line).join('\n')}
`;

      fs.writeFileSync(filepath, yaml, 'utf8');
      count++;
    }
  });

  console.log(`✅ 已生成 ${count} 个策略模板文件`);
}

generateAll();
