/**
 * 模板变量替换工具
 * 支持 {{variable}} 格式的变量占位符替换
 */

export interface TemplateVars {
  [key: string]: string | number | undefined;
}

/**
 * 渲染模板，替换变量占位符
 * @param md Markdown模板字符串
 * @param vars 变量对象
 * @returns 替换后的字符串
 */
export function renderTpl(md: string, vars: TemplateVars): string {
  if (!md) return '';

  return md.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    if (value === undefined || value === null) {
      console.warn(`[Template] 变量 ${key} 未定义`);
      return '';
    }
    return String(value);
  });
}

/**
 * 检查模板中是否有未替换的变量
 * @param md 渲染后的字符串
 * @returns 未替换的变量列表
 */
export function checkUnresolvedVars(md: string): string[] {
  const matches = md.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];

  return matches.map(m => m.replace(/[{}]/g, ''));
}

/**
 * 获取模板中使用的所有变量名
 * @param md 模板字符串
 * @returns 变量名列表
 */
export function extractVars(md: string): string[] {
  const matches = md.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];

  const vars = new Set<string>();
  matches.forEach(m => {
    const key = m.replace(/[{}]/g, '');
    vars.add(key);
  });

  return Array.from(vars);
}
