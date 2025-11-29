/**
 * 策略模板种子脚本
 * 从YAML文件读取模板并写入数据库
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const prisma = new PrismaClient();

interface TemplateYaml {
  key: string;
  title: string;
  language: string;
  category: string;
  tags: string;
  bodyMd: string;
  variants?: Array<{
    variantKey: string;
    weight: number;
    bodyMd: string;
  }>;
}

async function seedStrategyTemplates() {
  const templatesDir = path.join(__dirname, '../content/strategy-templates');
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.yaml'));

  console.log(`📝 找到 ${files.length} 个模板文件`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content) as TemplateYaml;

      // Upsert 主模板
      const template = await prisma.strategyTemplate.upsert({
        where: { key: data.key },
        update: {
          title: data.title,
          language: data.language,
          category: data.category,
          tags: data.tags,
          bodyMd: data.bodyMd,
          isActive: true
        },
        create: {
          key: data.key,
          title: data.title,
          language: data.language,
          category: data.category,
          tags: data.tags,
          bodyMd: data.bodyMd,
          isActive: true,
          useCount: 0
        }
      });

      // Upsert 变体
      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          await prisma.strategyTemplateVariant.upsert({
            where: {
              templateId_variantKey: {
                templateId: template.id,
                variantKey: variant.variantKey
              }
            },
            update: {
              weight: variant.weight,
              bodyMd: variant.bodyMd,
              isActive: true
            },
            create: {
              templateId: template.id,
              variantKey: variant.variantKey,
              weight: variant.weight,
              bodyMd: variant.bodyMd,
              isActive: true
            }
          });
        }
      }

      successCount++;
      console.log(`✅ ${data.key}`);

    } catch (error) {
      errorCount++;
      console.error(`❌ ${file}:`, error);
    }
  }

  console.log(`\n📊 完成: 成功 ${successCount}, 失败 ${errorCount}`);
}

seedStrategyTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
