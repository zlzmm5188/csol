#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量上传优化后的文件到服务器
"""

import subprocess
import time
from pathlib import Path

BASE_DIR = Path("/Volumes/BOOTCAMP/zijinzuixin/qiantai")
SERVER = "root@72.60.196.188"
PASSWORD = "Qq78234699+++"
TARGET = "/www/wwwroot/4kp3l0iq.top/"

EXCLUDE = ['backup', 'test', 'old', 'bak', 'broken', 'original', 'debug', 'cache-test', 'clear-cache', '备份']

def should_upload(filepath):
    return not any(p in filepath.name.lower() for p in EXCLUDE)

def upload_batch(files):
    """上传一批文件"""
    cmd = [
        'sshpass', '-p', PASSWORD,
        'scp', '-o', 'StrictHostKeyChecking=no',
        '-o', 'ConnectionAttempts=3'
    ] + [str(f) for f in files] + [f'{SERVER}:{TARGET}']

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=BASE_DIR
        )
        return result.returncode == 0
    except Exception as e:
        return False

def main():
    print("=" * 90)
    print("上传优化后的文件到服务器")
    print("=" * 90)
    print()

    # 收集文件
    html_files = sorted([f for f in BASE_DIR.glob("*.html") if should_upload(f)])
    js_files = sorted([f for f in BASE_DIR.glob("*.js") if should_upload(f) and not f.name.endswith('.min.js')])

    all_files = html_files + js_files

    print(f"📄 HTML文件: {len(html_files)} 个")
    print(f"📜 JavaScript文件: {len(js_files)} 个")
    print(f"🚀 总计: {len(all_files)} 个文件")
    print()

    response = input("确认上传？(y/n): ").lower().strip()
    if response != 'y':
        print("已取消")
        return

    print()
    print("-" * 90)

    # 分批上传（每批8个）
    batch_size = 8
    success = 0

    for i in range(0, len(all_files), batch_size):
        batch = all_files[i:i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(all_files) + batch_size - 1) // batch_size

        display = ', '.join([f.name for f in batch[:2]])
        if len(batch) > 2:
            display += f" ...+{len(batch)-2}"

        print(f"[{batch_num:3d}/{total_batches}] {display:60s} ", end='', flush=True)

        if upload_batch(batch):
            print("✅")
            success += len(batch)
        else:
            print("✗")

        time.sleep(0.2)

    print("-" * 90)
    print()
    print(f"✅ 完成！成功上传 {success}/{len(all_files)} 个文件")
    print("=" * 90)

if __name__ == "__main__":
    main()
