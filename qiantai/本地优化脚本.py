#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Providence 前台本地优化完整流程
1. 备份原文件
2. 检查CSS问题
3. 安全修复
4. 验证完整性
5. 批量上传
"""

import re
import shutil
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/Volumes/BOOTCAMP/zijinzuixin/qiantai")
BACKUP_DIR = BASE_DIR / "备份_原始文件"
EXCLUDE = ['backup', 'test', 'old', 'bak', 'broken', 'original', 'debug', 'cache-test', 'clear-cache']
MAIN_NAV = ['index.html', 'profile.html', 'projects.html', 'messages.html']

def should_process(filename):
    return not any(p in filename.lower() for p in EXCLUDE)

def backup_file(filepath):
    """备份文件"""
    BACKUP_DIR.mkdir(exist_ok=True)
    backup_path = BACKUP_DIR / filepath.name
    shutil.copy2(filepath, backup_path)

def safe_optimize(content, filename):
    """安全优化 - 只修复CSS，不删除HTML"""
    changes = []

    # 1. 修复CSS截断
    if 'max-' in content and re.search(r'max-\s+(?:padding|display|position):', content):
        content = re.sub(r'max-\s+padding:', 'max-width: 100%;\n      padding:', content)
        content = re.sub(r'max-\s+display:', 'max-width: 100%;\n      display:', content)
        changes.append('修复CSS截断')

    # 2. 添加iOS适配（如果缺少）
    if 'apple-mobile-web-app-capable' not in content:
        if '<meta name="viewport"' in content:
            viewport_pos = content.find('<meta name="viewport"')
            end_pos = content.find('>', viewport_pos) + 1
            ios_meta = '\n    <!-- iOS适配 -->\n    <meta name="apple-mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n    <meta name="theme-color" content="#0a1020">\n'
            content = content[:end_pos] + ios_meta + content[end_pos:]
            changes.append('添加iOS适配')

    # 3. 统一返回按钮样式（只在<style>内修改）
    if '.back-btn' in content and '<style>' in content:
        unified_btn = '''.back-btn {
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 8px !important;
        background: rgba(232, 201, 145, 0.15) !important;
        border: 1px solid rgba(232, 201, 145, 0.3) !important;
        color: #e8c991 !important;
        font-size: 20px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
    }
    .back-btn:active {
        transform: scale(0.95) !important;
    }'''

        # 只替换第一个<style>标签内的.back-btn
        style_start = content.find('<style>')
        style_end = content.find('</style>', style_start)

        if style_start > 0 and style_end > style_start:
            style_content = content[style_start:style_end]
            if '.back-btn' in style_content:
                # 替换.back-btn定义
                new_style = re.sub(
                    r'\.back-btn\s*\{[^}]*\}(?:\s*\.back-btn:active\s*\{[^}]*\})?',
                    unified_btn,
                    style_content,
                    flags=re.DOTALL
                )
                content = content[:style_start] + new_style + content[style_end:]
                changes.append('统一返回按钮')

    # 4. 确保topbar/top使用fixed定位（只修改CSS）
    if ('.topbar' in content or '.top {' in content) and '<style>' in content:
        style_start = content.find('<style>')
        style_end = content.find('</style>', style_start)

        if style_start > 0 and style_end > style_start:
            style_content = content[style_start:style_end]

            # 修复.topbar
            if '.topbar' in style_content and 'position: fixed' not in style_content:
                style_content = re.sub(
                    r'(\.topbar\s*\{)',
                    r'\1\n      position: fixed !important;\n      top: 0 !important;\n      left: 0 !important;\n      right: 0 !important;\n      z-index: 1000 !important;',
                    style_content
                )
                content = content[:style_start] + style_content + content[style_end:]
                changes.append('修复topbar定位')

    return content, changes

def verify_content(content, filename):
    """验证内容完整性"""
    issues = []

    # 检查是否有明显的内容
    if len(content) < 1000:
        issues.append(f"文件过小({len(content)}字节)")

    # 检查必要的HTML结构
    if '<html' not in content.lower():
        issues.append("缺少<html>标签")

    if '<body' not in content.lower():
        issues.append("缺少<body>标签")

    # 检查是否有关键内容（根据文件名）
    if 'company-news' in filename and 'Providence' not in content:
        issues.append("缺少Providence内容")

    return issues

def main():
    print("=" * 90)
    print("Providence 前台本地优化")
    print("=" * 90)
    print()

    html_files = sorted([f for f in BASE_DIR.glob("*.html") if should_process(f.name)])

    print(f"📄 找到 {len(html_files)} 个HTML文件需要处理")
    print()

    # 询问是否继续
    print("将执行以下操作：")
    print("  1. 备份所有原文件到 '备份_原始文件' 目录")
    print("  2. 安全优化CSS（不删除HTML内容）")
    print("  3. 验证内容完整性")
    print()

    response = input("是否继续？(y/n): ").lower().strip()
    if response != 'y':
        print("已取消")
        return

    print()
    print("-" * 90)

    optimized = 0
    errors = 0

    for filepath in html_files:
        try:
            # 1. 备份
            backup_file(filepath)

            # 2. 读取
            content = filepath.read_text(encoding='utf-8')

            # 3. 验证原内容
            issues = verify_content(content, filepath.name)
            if issues:
                print(f"⚠️  {filepath.name:50s} - 原文件有问题: {', '.join(issues)}")
                errors += 1
                continue

            # 4. 优化
            new_content, changes = safe_optimize(content, filepath.name)

            # 5. 验证新内容
            new_issues = verify_content(new_content, filepath.name)
            if new_issues:
                print(f"✗ {filepath.name:50s} - 优化后有问题: {', '.join(new_issues)}")
                errors += 1
                continue

            # 6. 保存
            if changes:
                filepath.write_text(new_content, encoding='utf-8')
                change_str = ', '.join(changes[:2])
                if len(changes) > 2:
                    change_str += f' +{len(changes)-2}项'
                print(f"✅ {filepath.name:50s} - {change_str}")
                optimized += 1
            else:
                print(f"- {filepath.name:50s} - 无需优化")

        except Exception as e:
            print(f"✗ {filepath.name:50s} - 错误: {e}")
            errors += 1

    print("-" * 90)
    print()
    print(f"✅ 完成！")
    print(f"   优化: {optimized} 个文件")
    print(f"   错误: {errors} 个文件")
    print(f"   备份: {BACKUP_DIR}")
    print()
    print("=" * 90)

if __name__ == "__main__":
    main()
