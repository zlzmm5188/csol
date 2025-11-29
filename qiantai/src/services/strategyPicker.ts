/**
 * 策略模板选择算法
 * 自动匹配项目特征到合适的策略模板，支持A/B测试
 */

import { renderTpl } from '../utils/tpl';

export type Category = 'ipo' | 'bond' | 'fund' | 'general';
export type RiskStyle = 'lowdd' | 'balanced' | 'aggressive';

export interface MatchInput {
  category: Category;
  riskStyle?: RiskStyle;
  keywords?: string[];
  language?: string;
}

export interface StrategyTemplate {
  id: number;
  key: string;
  title: string;
  language: string;
  category: string;
  tags: string;
  bodyMd: string;
  isActive: boolean;
  useCount: number;
  variants?: StrategyVariant[];
}

export interface StrategyVariant {
  id: number;
  variantKey: string;
  weight: number;
  bodyMd: string;
  isActive: boolean;
}

export interface SelectedStrategy {
  template: StrategyTemplate;
  variant: StrategyVariant | null;
  score: number;
}

/**
 * 选择策略模板
 * @param input 匹配输入参数
 * @param templates 所有可用模板（从数据库查询）
 * @returns 选中的模板和变体
 */
export async function pickStrategy(
  input: MatchInput,
  templates: StrategyTemplate[]
): Promise<SelectedStrategy | null> {
  const language = input.language || 'zh-CN';

  // 1. 过滤：语言 + 类别 + 激活状态
  let candidates = templates.filter(t =>
    t.language === language &&
    t.category === input.category &&
    t.isActive === true
  );

  if (candidates.length === 0) {
    console.warn(`[StrategyPicker] 未找到匹配的模板: category=${input.category}, language=${language}`);
    return null;
  }

  // 2. 标签/关键字打分
  if (input.keywords && input.keywords.length > 0) {
    candidates = candidates.map(t => ({
      ...t,
      score: calculateTagScore(t, input.keywords || [], input.riskStyle)
    })).sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // 3. useCount 越低权重越高（冷启动优先）
  candidates = candidates.map(t => ({
    ...t,
    coldStartBonus: Math.max(0, 100 - t.useCount) / 100
  }));

  // 4. 综合评分排序
  candidates.sort((a, b) => {
    const scoreA = (a.score || 0) + (a.coldStartBonus || 0);
    const scoreB = (b.score || 0) + (b.coldStartBonus || 0);
    return scoreB - scoreA;
  });

  // 5. 选择最佳模板
  const selectedTemplate = candidates[0];
  if (!selectedTemplate) return null;

  // 6. 在变体中按权重随机选择
  const variant = selectVariant(selectedTemplate.variants || []);

  return {
    template: selectedTemplate,
    variant,
    score: (selectedTemplate.score || 0) + (selectedTemplate.coldStartBonus || 0)
  };
}

/**
 * 计算标签匹配分数
 */
function calculateTagScore(
  template: StrategyTemplate,
  keywords: string[],
  riskStyle?: RiskStyle
): number {
  let score = 0;
  const tags = (template.tags || '').split(',').map(t => t.trim().toLowerCase());

  // 关键字匹配
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (tags.some(t => t.includes(kwLower))) {
      score += 10;
    }
  });

  // 风险风格匹配
  if (riskStyle) {
    const riskKeywords: Record<RiskStyle, string[]> = {
      lowdd: ['低回撤', '稳健', '保守'],
      balanced: ['平衡', '均衡', '适中'],
      aggressive: ['进取', '激进', '高收益']
    };

    const riskKws = riskKeywords[riskStyle] || [];
    riskKws.forEach(rk => {
      if (tags.some(t => t.includes(rk.toLowerCase()))) {
        score += 5;
      }
    });
  }

  return score;
}

/**
 * 按权重随机选择变体
 */
function selectVariant(variants: StrategyVariant[]): StrategyVariant | null {
  if (variants.length === 0) return null;

  const activeVariants = variants.filter(v => v.isActive);
  if (activeVariants.length === 0) return null;

  // 计算总权重
  const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return activeVariants[0];

  // 随机选择
  let random = Math.random() * totalWeight;
  for (const variant of activeVariants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant;
    }
  }

  return activeVariants[0];
}

/**
 * 生成变量替换对象（从产品数据）
 */
export function generateTemplateVars(product: {
  cycleDays?: number;
  baseAPR?: number;
  vipAdd?: number;
  minInvest?: number;
  maxInvest?: number;
  riskDrawdown?: number;
}): Record<string, string | number> {
  return {
    cycle_days: product.cycleDays || 0,
    base_rate: product.baseAPR || 0,
    vip_add: product.vipAdd || 0,
    min_invest: product.minInvest || 0,
    max_invest: product.maxInvest || 0,
    risk_drawdown: product.riskDrawdown || 3
  };
}

/**
 * 渲染策略文案（模板+变量替换）
 */
export function renderStrategy(
  template: StrategyTemplate,
  variant: StrategyVariant | null,
  vars: Record<string, string | number>
): string {
  const md = variant ? variant.bodyMd : template.bodyMd;
  return renderTpl(md, vars);
}
