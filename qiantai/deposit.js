// 充值页面 - 优化UI和接口对接 - 统一使用config.js的API封装
// 确保在HTML中已加载config.js: <script src="config.js"></script>
(function () {
    // const TOKEN_KEY = 'providence_token';

    // 等待API对象加载
    function waitForAPI() {
        return new Promise((resolve) => {
            if (window.API && window.API_CONFIG) {
                resolve();
            } else {
                const check = setInterval(() => {
                    if (window.API && window.API_CONFIG) {
                        clearInterval(check);
                        resolve();
                    }
                }, 50);
                setTimeout(() => {
                    clearInterval(check);
                    resolve();
                }, 3000);
            }
        });
    }

    let selectedMethod = 'bank';
    let currentAmount = 0;
    let usdtRate = 0; // USDT对人民币汇率

    // 获取元素
    const balanceEl = document.getElementById('currentBalance');
    const amountInput = document.getElementById('depositAmount');
    const receiveAmountEl = document.getElementById('receiveAmount');
    const depositAmountDisplay = document.getElementById('depositAmountDisplay');
    const receiveAmountDisplay = document.getElementById('receiveAmountDisplay');
    const submitBtn = document.getElementById('submitDeposit');
    const amountTitle = document.getElementById('amountTitle');
    const currencySymbol = document.getElementById('currencySymbol');
    const receiveLabel = document.getElementById('receiveLabel');
    const feeOrRateLabel = document.getElementById('feeOrRateLabel');
    const feeOrRateValue = document.getElementById('feeOrRateValue');

    // 加载用户余额
    async function loadBalance() {
        try {
            await waitForAPI();
            // const token = localStorage.getItem(TOKEN_KEY);
            // if (!token) {
            //     await showToast('提示', '请先登录');
            //     setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            //     return;
            // }

            // 优先使用统一API封装
            if (window.API && window.API.user && window.API.user.getInfo) {
                const result = await window.API.user.getInfo();
                if (result.success && result.data) {
                    const balance = parseFloat(result.data.money || 0);
                    balanceEl.textContent = balance.toLocaleString('zh-CN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    console.log('✅ 余额加载成功（统一API）:', balance);
                    return;
                }
            }

            // 降级方案
            await waitForAPI();
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const res = await fetch(API_BASE + '/api/user/info', {  // ✅ 正确接口
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const text = await res.text();

            // 检查是否是HTML错误页面
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
                console.warn('[API] /api/user/info 返回HTML错误页面');
                return;
            }

            let data;
            try { data = JSON.parse(text); } catch (e) {
                console.error('解析失败:', text);
                return;
            }

            if ((data.code === 200 || data.msg === 'ok') && data.data) {
                const balance = parseFloat(data.data.money || 0);
                balanceEl.textContent = balance.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                console.log('✅ 余额加载成功（降级方案）:', balance);
            }
        } catch (error) {
            console.error('❌ 加载余额失败:', error);
        }
    }

    let usdtAddress = '';
    let usdtQrcode = '';
    let voucherFile = null;

    // 加载USDT汇率
    async function loadUsdtRate() {
        try {
            await waitForAPI();
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';

            // 优先使用统一API封装（如果config.js中有对应接口）
            let data = null;
            // 降级方案：直接使用fetch
            const res = await fetch(API_BASE + '/get_usdt_rate', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const text = await res.text();

            // 检查是否是HTML错误页面
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
                console.warn('[API] /get_usdt_rate 返回HTML错误页面');
                return;
            }

            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('解析汇率失败:', text);
                return;
            }

            if (data) {
                try {
                    if (data.price || data.data?.price) {
                        usdtRate = parseFloat(data.price || data.data.price) || 0;
                        console.log('USDT汇率:', usdtRate);
                        updateUIForMethod();
                    }
                } catch (error) {
                    console.error('加载USDT汇率失败:', error);
                }
            }
        } catch (error) {
            console.error('loadUsdtRate失败:', error);
        }
    }

    // 充值方式选择
    document.querySelectorAll('.payment-method-card').forEach(card => {
            card.addEventListener('click', function () {
                document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                selectedMethod = this.dataset.method;
                updateArrivalTime();
                updateUIForMethod();

                // 显示/隐藏USDT信息
                const usdtInfoCard = document.getElementById('usdtInfoCard');
                if (selectedMethod === 'usdt') {
                    usdtInfoCard.classList.add('show');
                    if (!usdtAddress) {
                        loadUsdtInfo();
                    }
                    if (!usdtRate) {
                        loadUsdtRate();
                    }
                } else {
                    usdtInfoCard.classList.remove('show');
                }

                // 重置金额
                amountInput.value = '';
                currentAmount = 0;
                updateReceiveAmount(0);

                console.log('充值方式:', getMethodName(selectedMethod));
            });
        });

        // 根据充值方式更新UI
        function updateUIForMethod() {
            const bankTransferNotice = document.getElementById('bankTransferNotice');

            if (selectedMethod === 'usdt') {
                amountTitle.textContent = '充值USDT数量';
                currencySymbol.textContent = '';
                currencySymbol.style.display = 'none';
                amountInput.placeholder = '请输入USDT数量';
                amountInput.min = '100';
                receiveLabel.textContent = '到账金额(人民币)';
                feeOrRateLabel.textContent = 'USDT汇率';
                if (usdtRate > 0) {
                    feeOrRateValue.textContent = '1 USDT = ¥' + usdtRate.toFixed(4);
                } else {
                    feeOrRateValue.textContent = '加载中...';
                }

                // 隐藏银行转账提示
                if (bankTransferNotice) {
                    bankTransferNotice.classList.add('hidden');
                }

                // 更新快捷金额按钮（USDT数量）
                const quickBtns = document.querySelectorAll('.quick-amount-btn');
                if (quickBtns.length >= 4) {
                    quickBtns[0].textContent = '1,000';
                    quickBtns[0].dataset.amount = '1000';
                    quickBtns[1].textContent = '5,000';
                    quickBtns[1].dataset.amount = '5000';
                    quickBtns[2].textContent = '10,000';
                    quickBtns[2].dataset.amount = '10000';
                    quickBtns[3].textContent = '50,000';
                    quickBtns[3].dataset.amount = '50000';
                }
            } else {
                amountTitle.textContent = '充值金额';
                currencySymbol.textContent = '';
                currencySymbol.style.display = 'none';
                amountInput.placeholder = '请输入充值金额';
                amountInput.min = '100';
                receiveLabel.textContent = '到账金额';
                feeOrRateLabel.textContent = '手续费';
                feeOrRateValue.textContent = '0.00';

                // 显示银行转账提示
                if (bankTransferNotice) {
                    bankTransferNotice.classList.remove('hidden');
                }

                // 更新快捷金额按钮（人民币）
                const quickBtns = document.querySelectorAll('.quick-amount-btn');
                if (quickBtns.length >= 4) {
                    quickBtns[0].textContent = '1,000';
                    quickBtns[0].dataset.amount = '1000';
                    quickBtns[1].textContent = '5,000';
                    quickBtns[1].dataset.amount = '5000';
                    quickBtns[2].textContent = '10,000';
                    quickBtns[2].dataset.amount = '10000';
                    quickBtns[3].textContent = '50,000';
                    quickBtns[3].dataset.amount = '50000';
                }
            }
        }

        // 快捷金额
        document.querySelectorAll('.quick-amount-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const amount = this.dataset.amount;
                amountInput.value = amount;
                const amountNum = parseFloat(amount);
                currentAmount = amountNum;
                updateReceiveAmount(amountNum);
                this.style.background = '#0e2b44';
                this.style.color = '#fff';
                this.style.borderColor = '#0e2b44';

                // 重置其他按钮
                document.querySelectorAll('.quick-amount-btn').forEach(b => {
                    if (b !== this) {
                        b.style.background = '#fff';
                        b.style.color = '#1a1a1a';
                        b.style.borderColor = '#e8ecf0';
                    }
                });
            });
        });

        // 金额输入
        amountInput.addEventListener('input', function () {
            const amount = parseFloat(this.value) || 0;
            currentAmount = amount;
            updateReceiveAmount(amount);

            // 清除快捷按钮选中状态
            document.querySelectorAll('.quick-amount-btn').forEach(b => {
                b.style.background = '#fff';
                b.style.color = '#1a1a1a';
                b.style.borderColor = '#e8ecf0';
            });
        });

        // 更新到账金额
        function updateReceiveAmount(amount) {
            let receiveAmount = 0;

            if (selectedMethod === 'usdt') {
                // USDT充值：根据USDT数量和汇率计算人民币
                if (usdtRate > 0 && amount > 0) {
                    receiveAmount = amount * usdtRate;
                } else {
                    receiveAmount = 0;
                }
            } else {
                // 银行充值：到账金额等于充值金额（假设无手续费）
                receiveAmount = amount;
            }

            const formatted = parseFloat(receiveAmount || 0).toFixed(2);
            if (receiveAmountEl) {
                receiveAmountEl.textContent = formatted;
            }
            if (receiveAmountDisplay) {
                receiveAmountDisplay.textContent = formatted;
            }
            if (depositAmountDisplay) {
                depositAmountDisplay.textContent = parseFloat(amount || 0).toFixed(2);
            }
        }

        // 更新到账时间
        function updateArrivalTime() {
            // 已移除到账时间显示
        }

        // 加载USDT信息（地址和二维码）
        async function loadUsdtInfo() {
            try {
                // const token = localStorage.getItem(TOKEN_KEY);
                // if (!token) return;

                await waitForAPI();
                const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
                // 假设接口为 /pay/us/info 或类似
                const res = await fetch(API_BASE + '/pay/us/info', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                        // 'Token': token
                    }
                });

                const text = await res.text();

                // 检查是否是HTML错误页面
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
                    console.warn('[API] /pay/us/info 返回HTML错误页面');
                    return;
                }

                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('解析失败:', text);
                    return;
                }

                if (data.code === 1 || data.code === 200 && data.data) {
                    usdtAddress = data.data.address || data.data.usdt_address || '';
                    usdtQrcode = data.data.qrcode || data.data.qr_code || '';

                    const addressEl = document.getElementById('usdtAddress');
                    const qrcodeEl = document.getElementById('usdtQrcode');

                    if (addressEl) addressEl.textContent = usdtAddress || '暂无地址';
                    if (qrcodeEl && usdtQrcode) {
                        qrcodeEl.src = usdtQrcode;
                        qrcodeEl.style.display = 'block';
                    } else if (qrcodeEl) {
                        qrcodeEl.style.display = 'none';
                    }
                } else {
                    console.error('获取USDT信息失败:', data.msg);
                    document.getElementById('usdtAddress').textContent = '获取失败，请重试';
                }
            } catch (error) {
                console.error('加载USDT信息失败:', error);
                document.getElementById('usdtAddress').textContent = '加载失败';
            }
        }

        // 复制地址
        document.getElementById('copyAddressBtn')?.addEventListener('click', async function () {
            if (!usdtAddress) {
                await showToast('提示', '地址未加载，请稍后再试');
                return;
            }

            try {
                await navigator.clipboard.writeText(usdtAddress);
                await showToast('成功', '地址已复制到剪贴板');
                this.textContent = '已复制';
                setTimeout(() => {
                    this.textContent = '复制地址';
                }, 2000);
            } catch (err) {
                // 降级方案
                const textarea = document.createElement('textarea');
                textarea.value = usdtAddress;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    await showToast('成功', '地址已复制到剪贴板');
                    this.textContent = '已复制';
                    setTimeout(() => {
                        this.textContent = '复制地址';
                    }, 2000);
                } catch (e) {
                    await showToast('错误', '复制失败，请手动复制');
                }
                document.body.removeChild(textarea);
            }
        });

        // 凭证上传
        const voucherFileInput = document.getElementById('voucherFileInput');
        const voucherUploadArea = document.getElementById('voucherUploadArea');
        const voucherPreview = document.getElementById('voucherPreview');
        const voucherPreviewImg = document.getElementById('voucherPreviewImg');
        const voucherRemoveBtn = document.getElementById('voucherRemoveBtn');

        voucherFileInput?.addEventListener('change', function (e) {
            const file = e.target.files[0];
            console.log('📎 文件选择事件触发:', {
                hasFile: !!file,
                fileName: file?.name,
                fileSize: file?.size,
                fileType: file?.type
            });

            if (!file) {
                console.log('⚠️ 未选择文件');
                voucherFile = null;
                return;
            }

            // 上传时进行文件安全检查（第一次验证）
            const fileValidation = validateFileSecurity(file);
            if (!fileValidation.valid) {
                console.log('❌ 文件验证失败:', fileValidation.message);
                showToast('错误', fileValidation.message);
                this.value = ''; // 清空文件选择
                voucherFile = null; // 清除文件引用
                if (voucherPreview) voucherPreview.classList.remove('show');
                if (voucherUploadArea) voucherUploadArea.classList.remove('has-file');
                return;
            }

            // 验证通过，保存文件
            voucherFile = file;
            console.log('✅ 文件验证通过，已保存:', {
                fileName: voucherFile.name,
                fileSize: voucherFile.size,
                fileType: voucherFile.type
            });

            // 显示预览
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log('🖼️ 文件预览加载成功');
                if (voucherPreviewImg) voucherPreviewImg.src = e.target.result;
                if (voucherPreview) voucherPreview.classList.add('show');
                if (voucherUploadArea) voucherUploadArea.classList.add('has-file');
            };
            reader.onerror = function () {
                console.error('❌ 文件读取失败');
                showToast('错误', '文件读取失败，请重新选择文件');
                voucherFile = null;
                voucherFileInput.value = '';
            };
            reader.readAsDataURL(file);
        });

        voucherRemoveBtn?.addEventListener('click', function () {
            console.log('🗑️ 移除凭证文件');
            voucherFile = null;
            if (voucherFileInput) voucherFileInput.value = '';
            if (voucherPreview) voucherPreview.classList.remove('show');
            if (voucherUploadArea) voucherUploadArea.classList.remove('has-file');
        });

        /**
         * 文件安全检查函数
         *
         * 验证文件的安全性，包括：
         * 1. MIME类型白名单验证（仅允许图片类型）
         * 2. 文件扩展名白名单验证
         * 3. 文件大小限制（最大5MB）
         * 4. 文件不能为空
         *
         * 注意：前端验证只是第一道防线，后端必须进行更严格的安全验证：
         * - 验证文件MIME类型（不要仅依赖扩展名）
         * - 验证文件内容（检查文件头/魔数）
         * - 文件重命名（避免执行恶意脚本）
         * - 限制上传目录权限（不可执行）
         * - 使用白名单验证文件类型
         * - 检查文件大小和内容长度
         * - 扫描文件内容是否有恶意代码
         *
         * @param {File} file - 要验证的文件对象
         * @returns {Object} {valid: boolean, message: string} - 验证结果
         */
        function validateFileSecurity(file) {
            // 1. 检查文件是否存在
            if (!file) {
                return { valid: false, message: '请选择要上传的文件' };
            }

            // 2. 检查文件大小是否为0（文件不能为空）
            if (file.size === 0) {
                return { valid: false, message: '文件不能为空，请重新选择文件' };
            }

            // 3. 检查文件大小（最大5MB）
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                return { valid: false, message: `文件大小不能超过5MB，当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB` };
            }

            // 4. MIME类型白名单验证（仅允许图片类型）
            const allowedMimeTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp'
            ];

            if (!allowedMimeTypes.includes(file.type)) {
                return { valid: false, message: '只支持上传图片文件（JPG、PNG、GIF、WEBP），当前文件类型：' + (file.type || '未知') };
            }

            // 5. 文件扩展名白名单验证
            const fileName = file.name.toLowerCase();
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

            if (!hasValidExtension) {
                return { valid: false, message: '文件扩展名无效，只支持图片格式（.jpg、.jpeg、.png、.gif、.webp）' };
            }

            // 6. 检查文件名是否包含危险字符（防止路径遍历攻击）
            const dangerousChars = ['../', '..\\', '/', '\\', '<', '>', '|', ':', '"', '*', '?'];
            const hasDangerousChar = dangerousChars.some(char => fileName.includes(char));
            if (hasDangerousChar) {
                return { valid: false, message: '文件名包含非法字符，请重命名后重新上传' };
            }

            // 所有验证通过
            return { valid: true };
        }

        // 提交充值
        submitBtn.addEventListener('click', async function () {
            if (currentAmount < 100) {
                await showToast('提示', selectedMethod === 'usdt' ? '最低充值数量为100 USDT' : '最低充值金额为100元');
                return;
            }

            if (currentAmount !== Math.floor(currentAmount)) {
                await showToast('提示', '充值数量必须为整数');
                return;
            }

            // ========== 必须上传凭证检查（所有充值方式都强制要求） ==========
            // 如果voucherFile为空，尝试从文件输入框重新获取
            if (!voucherFile && voucherFileInput && voucherFileInput.files && voucherFileInput.files.length > 0) {
                console.log('🔄 从文件输入框重新获取文件');
                voucherFile = voucherFileInput.files[0];
            }

            // 再次检查
            if (!voucherFile) {
                console.log('❌ 凭证文件检查失败:', {
                    voucherFile: voucherFile,
                    fileInput: voucherFileInput,
                    fileInputFiles: voucherFileInput?.files,
                    fileInputValue: voucherFileInput?.value
                });
                await showToast('提示', '请上传转款凭证');
                // 聚焦到凭证上传区域
                if (voucherUploadArea) {
                    voucherUploadArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    voucherUploadArea.style.border = '2px solid #ff3b30';
                    setTimeout(() => {
                        voucherUploadArea.style.border = '';
                    }, 2000);
                }
                return;
            }

            console.log('✅ 凭证文件检查通过:', {
                fileName: voucherFile.name,
                fileSize: voucherFile.size,
                fileType: voucherFile.type
            });

            // ========== 提交时进行文件安全检查（第二次验证，确保安全） ==========
            const fileValidation = validateFileSecurity(voucherFile);
            if (!fileValidation.valid) {
                await showToast('错误', fileValidation.message);
                // 清除无效文件
                voucherFile = null;
                if (voucherFileInput) voucherFileInput.value = '';
                if (voucherPreview) voucherPreview.classList.remove('show');
                if (voucherUploadArea) voucherUploadArea.classList.remove('has-file');
                return;
            }

            // 格式化显示信息
            let confirmMsg = '';
            if (selectedMethod === 'usdt') {
                const cnyAmount = (currentAmount * usdtRate).toFixed(2);
                confirmMsg = `充值USDT：${currentAmount.toLocaleString('zh-CN')} USDT\n汇率：1 USDT = ¥${usdtRate.toFixed(4)}\n到账金额：¥${cnyAmount}\n充值方式：USDT\n\n是否确认提交充值申请？`;
            } else {
                confirmMsg = `充值金额：${currentAmount.toLocaleString('zh-CN')}元\n充值方式：${getMethodName(selectedMethod)}\n\n是否确认提交充值申请？`;
            }

            const confirmed = await showToast('确认充值', confirmMsg, true);

            if (!confirmed) return;

            try {
                const token = localStorage.getItem('providence_token');
                submitBtn.disabled = true;
                submitBtn.textContent = '处理中...';

                // 根据选择的支付方式调用不同的接口
                const endpoint = selectedMethod === 'usdt'
                    ? '/pay/us/recharge'
                    : '/pay/pay/recharge';

                console.log('📤 提交充值:', { endpoint, amount: currentAmount, hasVoucher: !!voucherFile });

                // 如果是USDT充值，需要计算人民币金额
                let submitAmount = currentAmount;
                if (selectedMethod === 'usdt') {
                    // USDT充值：提交的是USDT数量，但后端可能需要人民币金额
                    // 根据实际后端需求，这里提交USDT数量
                    submitAmount = currentAmount;
                }

                // ========== 所有充值方式统一使用FormData提交凭证 ==========
                //
                // ⚠️ 后端安全验证要求（必须实现）：
                //
                // 1. 【MIME类型验证】验证文件MIME类型（不要仅依赖扩展名）
                //    - 使用 getimagesize() 或 file_get_contents() 读取文件头
                //    - 检查文件魔数（Magic Number）：JPEG(FF D8 FF)、PNG(89 50 4E 47)等
                //    - 防止伪造扩展名的恶意文件（如 .php 文件重命名为 .jpg）
                //
                // 2. 【文件内容验证】验证文件内容（检查文件头/魔数）
                //    - 读取文件前12字节，验证是否为有效的图片格式
                //    - 使用 imagecreatefromjpeg/png/gif 尝试加载图片
                //    - 如果加载失败，说明不是有效图片，拒绝上传
                //
                // 3. 【文件重命名】文件重命名（避免执行恶意脚本）
                //    - 不要使用用户上传的文件名
                //    - 使用随机文件名：voucher_{user_id}_{timestamp}_{random}.{ext}
                //    - 确保文件名不包含任何可执行代码
                //
                // 4. 【目录权限限制】限制上传目录权限（不可执行）
                //    - 上传目录设置权限为 0755 或 0644
                //    - 禁止 PHP 文件在上传目录执行：在 .htaccess 中设置 php_flag engine off
                //    - 使用独立的存储服务（如OSS）更安全
                //
                // 5. 【白名单验证】使用白名单验证文件类型
                //    - 只允许：jpg, jpeg, png, gif, webp
                //    - 使用白名单而不是黑名单
                //    - 同时验证扩展名和MIME类型
                //
                // 6. 【文件大小限制】检查文件大小和内容长度
                //    - 最大文件大小：5MB
                //    - 最小文件大小：10字节（防止空文件）
                //    - 检查文件实际大小是否与声明大小一致
                //
                // 7. 【恶意代码扫描】扫描文件内容是否有恶意代码
                //    - 检查是否包含 PHP 代码标签：<?php, <?, <%
                //    - 检查是否包含危险函数：eval, system, exec, shell_exec 等
                //    - 检查是否包含一句话木马特征
                //    - 检查文件头是否匹配（防止伪装成图片的可执行文件）
                //
                // 8. 【图片重新生成】（推荐）重新生成图片以去除隐藏内容
                //    - 使用 GD 或 Imagick 读取并重新保存图片
                //    - 这样可以去除图片中的 EXIF 数据和可能的隐藏内容
                //    - 重新生成后的图片更安全

                const formData = new FormData();
                // 必须：上传凭证文件
                // 再次确认文件存在（防止在等待确认对话框期间文件被清除）
                if (!voucherFile && voucherFileInput && voucherFileInput.files && voucherFileInput.files.length > 0) {
                    voucherFile = voucherFileInput.files[0];
                    console.log('🔄 提交前重新获取文件');
                }

                if (!voucherFile) {
                    await showToast('错误', '凭证文件丢失，请重新上传');
                    return;
                }

                console.log('📤 准备提交文件:', {
                    fileName: voucherFile.name,
                    fileSize: voucherFile.size,
                    fileType: voucherFile.type
                });

                formData.append('voucher', voucherFile);
                // 必须：充值金额
                formData.append('money', submitAmount.toString());
                // 注意：后端会根据endpoint自动判断type，不需要额外传type参数

                console.log('📤 准备提交:', {
                    endpoint: endpoint,
                    amount: submitAmount,
                    fileName: voucherFile.name,
                    fileSize: voucherFile.size,
                    fileType: voucherFile.type,
                    token: token ? '已设置' : '未设置'
                });

                await waitForAPI();
                const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
                const res = await fetch(API_BASE + endpoint, {
                    method: 'POST',
                    headers: {
                        // 'Token': token
                        // 注意：使用FormData时不要设置Content-Type，让浏览器自动设置
                    },
                    body: formData
                });

                console.log('📡 响应状态:', res.status, res.statusText);
                console.log('📡 请求URL:', API_BASE + endpoint);

                // 检查HTTP状态码
                if (!res.ok) {
                    console.error('❌ HTTP错误:', res.status, res.statusText);
                    await showToast('错误', `服务器错误 (${res.status})\n\n请稍后重试或联系客服`);
                    submitBtn.disabled = false;
                    submitBtn.textContent = '确认充值';
                    return;
                }

                const text = await res.text();
                console.log('📥 响应状态码:', res.status);
                console.log('📥 原始响应长度:', text.length);
                console.log('📥 原始响应预览:', text.substring(0, 500)); // 显示前500字符以便调试

                // 检查是否是HTML错误页面
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
                    console.error('❌ 服务器返回HTML错误页面，可能是PHP错误');
                    // 尝试从HTML中提取错误信息
                    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
                    const errorMatch = text.match(/错误[：:]\s*([^<\n]+)/i) || text.match(/Exception[：:]\s*([^<\n]+)/i);
                    const errorInfo = titleMatch ? titleMatch[1] : (errorMatch ? errorMatch[1] : '服务器内部错误');

                    await showToast('错误', `服务器发生错误，请联系技术支持\n\n${errorInfo}\n\n状态码: ${res.status}`);
                    submitBtn.disabled = false;
                    submitBtn.textContent = '确认充值';
                    return;
                }

                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('❌ JSON解析失败，原始响应:', text.substring(0, 300));
                    console.error('❌ 解析错误:', e);
                    await showToast('错误', `服务器返回格式错误，请检查网络或联系客服\n\n状态码: ${res.status}`);
                    submitBtn.disabled = false;
                    submitBtn.textContent = '确认充值';
                    return;
                }

                console.log('📥 API响应:', data);

                if (data.code === 200 || data.msg?.includes('成功') || data.msg?.includes('提交')) {
                    await showToast(
                        '提交成功',
                        '充值申请已提交成功\n工作人员将在2-5分钟内为您处理\n请耐心等待'
                    );
                    // 刷新余额
                    setTimeout(() => {
                        loadBalance();
                        amountInput.value = '';
                        updateReceiveAmount(0);
                        currentAmount = 0;
                        voucherFile = null;
                        if (voucherFileInput) voucherFileInput.value = '';
                        if (voucherPreview) voucherPreview.classList.remove('show');
                        if (voucherUploadArea) voucherUploadArea.classList.remove('has-file');
                    }, 2000);
                } else {
                    const msg = data.msg || '充值失败，请重试';
                    await showToast('错误', msg);
                }
            } catch (error) {
                console.error('❌ 充值失败:', error);
                await showToast('错误', '网络错误，请检查网络连接后重试');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '确认充值';
            }
        });

        // 获取支付方式名称
        function getMethodName(method) {
            const names = {
                'bank': '银行转账',
                'usdt': 'USDT'
            };
            return names[method] || method;
        }

        // 初始化
        document.addEventListener('DOMContentLoaded', function () {
            loadBalance();
            updateArrivalTime();
            loadUsdtRate(); // 预加载USDT汇率
            updateUIForMethod(); // 初始化UI（会显示银行转账提示）
            // 初始化顶部金额显示
            updateReceiveAmount(0);

            // 初始化凭证上传状态检查
            if (voucherFileInput && voucherFileInput.files && voucherFileInput.files.length > 0) {
                voucherFile = voucherFileInput.files[0];
                console.log('🔄 页面加载时恢复文件:', {
                    fileName: voucherFile.name,
                    fileSize: voucherFile.size
                });
            }

            console.log('✅ 充值页面初始化完成', {
                voucherFileInput: !!voucherFileInput,
                voucherFile: !!voucherFile,
                voucherUploadArea: !!voucherUploadArea
            });
        });
    })();
