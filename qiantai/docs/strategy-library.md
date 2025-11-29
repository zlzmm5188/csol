# 策略文案库系统文档

## 概述

策略文案库系统是一个自动化的产品策略文案生成和管理系统，支持：
- 自动匹配项目特征到合适的策略模板
- A/B测试和多语言支持
- 变量替换和动态内容生成
- 完整的审计追踪

## 系统架构

### 数据层（Prisma Schema）

#### 1. StrategyTemplate（策略模板主表）
- `key`: 模板唯一键（如 "bond_lowdd_core"）
- `title`: 模板标题
- `language`: 语言代码（默认 zh-CN）
- `category`: 类别（ipo | bond | fund | general）
- `tags`: 标签（逗号分隔）
- `bodyMd`: Markdown正文（支持变量占位）
- `useCount`: 被引用次数

#### 2. StrategyTemplateVariant（模板变体）
- `templateId`: 关联模板ID
- `variantKey`: 变体键（A | B | zh-CN | en-US）
- `weight`: 选择权重
- `bodyMd`: 变体正文

#### 3. ProductStrategyUse（审计追踪）
- `productId`: 产品ID
- `templateId`: 模板ID
- `variantId`: 变体ID
- `chosenTags`: 匹配标签快照

#### 4. Product（产品表扩展）
- `strategyMd`: 最终展示的策略文案（可覆盖）
- `strategyTplId`: 选中的模板ID
- `riskStyle`: 风险风格（lowdd | balanced | aggressive）
- `keywords`: 关键字（逗号分隔）

### 服务层

#### 选择算法（strategyPicker.ts）

```typescript
import { pickStrategy, MatchInput } from './src/services/strategyPicker';

const input: MatchInput = {
  category: 'bond',
  riskStyle: 'lowdd',
  keywords: ['低回撤', '量化'],
  language: 'zh-CN'
};

const result = await pickStrategy(input, templates);
// 返回: { template, variant, score }
```

**匹配逻辑**：
1. 过滤：语言 + 类别 + 激活状态
2. 标签/关键字打分（交集越大分越高）
3. useCount 越低权重越高（冷启动优先）
4. 在变体中按 weight 随机抽签（A/B测试）

#### 变量替换（tpl.ts）

```typescript
import { renderTpl } from './src/utils/tpl';

const md = "投资周期 {{cycle_days}} 天，基础年化 {{base_rate}}%";
const vars = {
  cycle_days: 30,
  base_rate: 9.2
};

const result = renderTpl(md, vars);
// 输出: "投资周期 30 天，基础年化 9.2%"
```

**支持的变量**：
- `cycle_days`: 投资周期（天）
- `base_rate`: 基础年化
- `vip_add`: VIP加息
- `min_invest`: 起投金额
- `max_invest`: 封顶金额
- `risk_drawdown`: 风险回撤（默认3%）

## 使用流程

### 1. 生成迁移

```bash
cd prisma
npx prisma migrate dev --name strategy_library_init
```

### 2. 安装依赖

```bash
npm install js-yaml @types/js-yaml
# 或
pnpm add js-yaml @types/js-yaml
```

### 3. 生成模板文件

```bash
# 运行生成脚本（生成≥100条模板）
node scripts/generate-strategy-templates.js
```

### 4. 导入种子数据

```bash
# 从YAML文件导入到数据库
npx ts-node scripts/seed.strategy.ts
```

### 5. 后端集成

在发布产品时自动注入策略文案：

```typescript
// POST /admin/product/create
async function createProduct(data) {
  // 1. 写入产品基础字段
  const product = await prisma.product.create({
    data: {
      title: data.title,
      category: data.category,
      baseAPR: data.baseAPR,
      cycleDays: data.cycleDays,
      minInvest: data.minInvest,
      riskStyle: data.riskStyle,
      keywords: data.keywords?.join(',')
    }
  });

  // 2. 如果 strategyMd 未填，自动选择模板
  if (!data.strategyMd) {
    const templates = await prisma.strategyTemplate.findMany({
      where: { isActive: true },
      include: { variants: { where: { isActive: true } } }
    });

    const input = {
      category: data.category,
      riskStyle: data.riskStyle,
      keywords: data.keywords,
      language: 'zh-CN'
    };

    const selected = await pickStrategy(input, templates);
    if (selected) {
      const vars = {
        cycle_days: data.cycleDays,
        base_rate: data.baseAPR,
        vip_add: 0,
        min_invest: data.minInvest,
        max_invest: data.maxInvest || 0,
        risk_drawdown: 3
      };

      const strategyMd = renderStrategy(
        selected.template,
        selected.variant,
        vars
      );

      // 更新产品
      await prisma.product.update({
        where: { id: product.id },
        data: {
          strategyMd,
          strategyTplId: selected.template.id
        }
      });

      // 记录审计
      await prisma.productStrategyUse.create({
        data: {
          productId: product.id,
          templateId: selected.template.id,
          variantId: selected.variant?.id,
          chosenTags: selected.template.tags
        }
      });

      // 增加引用计数
      await prisma.strategyTemplate.update({
        where: { id: selected.template.id },
        data: { useCount: { increment: 1 } }
      });
    }
  }

  return product;
}
```

### 6. 前端展示

```html
<!-- project-detail.html -->
<div class="strategy-section">
  <h3>投资策略</h3>
  <div id="strategyContent" class="strategy-md"></div>
</div>

<script>
// 使用 marked 和 DOMPurify 渲染Markdown
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const strategyMd = product.strategyMd || '默认策略说明...';
const html = marked.parse(strategyMd);
const clean = DOMPurify.sanitize(html);
document.getElementById('strategyContent').innerHTML = clean;
</script>
```

## 后台管理

### 换一条策略文案

```typescript
// POST /admin/product/:id/refresh-strategy
async function refreshStrategy(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  // 重新选择模板（可能换A/B或不同模板）
  const selected = await pickStrategy({
    category: product.category,
    riskStyle: product.riskStyle,
    keywords: product.keywords?.split(','),
    language: 'zh-CN'
  }, templates);

  // 更新策略文案
  // ...
}
```

### 覆盖编辑

```typescript
// POST /admin/product/:id/strategy
async function updateStrategy(productId: number, strategyMd: string) {
  // 直接覆盖 strategyMd，不更新 strategyTplId
  await prisma.product.update({
    where: { id: productId },
    data: { strategyMd }
  });
}
```

## 合规模板写作规则

### 语气要求
- 专业、克制、合规
- 不夸大、不承诺收益
- 避免使用"保本、保收益、稳赚、保证、绝对、100%"等敏感词

### 关键词池
- 低回撤 / 资金效率 / 纪律化 / 择券池
- 对冲 / 事件因子 / 透明度 / 组合分层
- 波动管理 / 申购纪律 / 流动性约束

### 模板结构
1. 1段 40–70 字的核心阐述
2. 3–4 条 bullet（每条 12–20 字）
3. 支持变量占位：`{{cycle_days}}`、`{{risk_drawdown}}`等

### 示例

```yaml
key: bond_lowdd_core
title: 固收低回撤·纪律增强
bodyMd: |
  本策略聚焦于**回撤可控**与**资金效率**两大驱动维度。

  - 历史真实回撤长期控制在 **{{risk_drawdown}}%** 区间
  - 深/沪可转债筛选模型 + **Q-自适应** 调仓
  - 组合透明化，**每周** 固定公开持仓分布
```

## 风控与合规

### 敏感词扫描

```typescript
const SENSITIVE_WORDS = [
  '保本', '保收益', '稳赚', '承诺', '绝对', '100%'
];

function checkSensitiveWords(text: string): string[] {
  const found = [];
  SENSITIVE_WORDS.forEach(word => {
    if (text.includes(word)) {
      found.push(word);
    }
  });
  return found;
}

// 发布前检查
const violations = checkSensitiveWords(strategyMd);
if (violations.length > 0) {
  throw new Error(`请修订策略文案，包含敏感词: ${violations.join(', ')}`);
}
```

## 监控与优化

### 使用统计

```sql
-- 统计各模板使用次数
SELECT
  t.key,
  t.title,
  COUNT(psu.id) as use_count,
  t.useCount as cached_count
FROM fa_strategy_template t
LEFT JOIN fa_product_strategy_use psu ON t.id = psu.templateId
GROUP BY t.id
ORDER BY use_count DESC;
```

### A/B测试分析

```sql
-- 统计变体选择分布
SELECT
  v.variantKey,
  COUNT(psu.id) as selected_count,
  AVG(p.raisedAmount) as avg_raised
FROM fa_strategy_template_variant v
LEFT JOIN fa_product_strategy_use psu ON v.id = psu.variantId
LEFT JOIN fa_fund_project p ON psu.productId = p.id
GROUP BY v.id
ORDER BY selected_count DESC;
```

## 快速开始

```bash
# 1. 生成迁移
cd prisma && npx prisma migrate dev --name strategy_library_init

# 2. 安装依赖
npm install js-yaml @types/js-yaml marked dompurify

# 3. 生成模板（≥100条）
node scripts/generate-strategy-templates.js

# 4. 导入种子数据
npx ts-node scripts/seed.strategy.ts

# 5. 运行单测
npm test strategyPicker.spec.ts
```

## 总结

策略文案库系统实现了：
- ✅ 自动化文案生成（≥100条模板）
- ✅ 智能匹配（类别+风险+关键字）
- ✅ A/B测试支持
- ✅ 变量替换
- ✅ 完整审计追踪
- ✅ 合规检查
- ✅ 使用统计与优化

---

**维护者**: Providence开发团队
**最后更新**: 2025-11-08
