// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 【Providence 实名认证 - 集成 OCR 自动识别】
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 全局变量
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentStep = 1;
let idCardImage = null;
let faceImage = null;
let videoStream = null;

// OCR 引擎
let ocrWorker = null;
let isOCRReady = false;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 图片压缩（优化OCR性能，避免大图导致失败）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();

      img.onload = function () {
        console.log('[压缩] 原始尺寸:', img.width, 'x', img.height);

        // 目标宽度（身份证识别1200px足够）
        const maxWidth = 1200;
        let width = img.width;
        let height = img.height;

        // 如果图片宽度超过最大宽度，按比例缩放
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        console.log('[压缩] 压缩后尺寸:', width, 'x', height);

        // 创建canvas进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为blob（JPEG格式，质量0.85）
        canvas.toBlob((blob) => {
          console.log('[压缩] 原始大小:', (file.size / 1024).toFixed(2), 'KB');
          console.log('[压缩] 压缩后大小:', (blob.size / 1024).toFixed(2), 'KB');

          // 创建新的File对象
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          resolve(compressedFile);
        }, 'image/jpeg', 0.85);
      };

      img.onerror = function () {
        console.error('[压缩] 图片加载失败');
        reject(new Error('图片加载失败'));
      };

      img.src = e.target.result;
    };

    reader.onerror = function () {
      console.error('[压缩] 文件读取失败');
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 文件安全检测（防止一句话木马）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function validateFileSecure(file) {
  console.log('[安全检测] 开始检查文件:', file.name);

  // 1. 检查文件类型（MIME Type）
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.error('[安全检测] ❌ 非法文件类型:', file.type);
    return { valid: false, error: '只允许上传 JPG、PNG、WEBP 格式的图片' };
  }

  // 2. 检查文件扩展名
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExt) {
    console.error('[安全检测] ❌ 非法文件扩展名:', fileName);
    return { valid: false, error: '文件扩展名不符合要求' };
  }

  // 3. 检查文件名是否包含可疑字符
  const dangerousPatterns = [
    /\.php/i,
    /\.asp/i,
    /\.jsp/i,
    /\.exe/i,
    /\.sh/i,
    /\.bat/i,
    /\.cmd/i,
    /<\?php/i,
    /<script/i,
    /eval\(/i,
    /base64_decode/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(fileName)) {
      console.error('[安全检测] ❌ 文件名包含危险字符:', fileName);
      return { valid: false, error: '文件名包含非法字符' };
    }
  }

  // 4. 检查文件大小（限制10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    console.error('[安全检测] ❌ 文件过大:', file.size);
    return { valid: false, error: '文件大小不能超过 10MB' };
  }

  // 5. 检查文件大小（至少10KB，防止空文件）
  const minSize = 10 * 1024; // 10KB
  if (file.size < minSize) {
    console.error('[安全检测] ❌ 文件过小:', file.size);
    return { valid: false, error: '文件大小异常，请上传有效的证件照片' };
  }

  console.log('[安全检测] ✅ 文件检查通过');
  return { valid: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 文件内容安全检测（读取文件头部检查）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function validateFileContent(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    // 只读取文件的前1KB内容用于检测
    const blob = file.slice(0, 1024);

    reader.onload = function (e) {
      const content = e.target.result;
      const textContent = new TextDecoder('utf-8').decode(new Uint8Array(content));

      console.log('[内容检测] 检查文件头部...');

      // 检查是否包含PHP、ASP等脚本代码
      const dangerousCode = [
        '<?php',
        '<?=',
        '<%',
        '<script',
        'eval(',
        'base64_decode',
        'exec(',
        'system(',
        'shell_exec',
        'passthru'
      ];

      for (const code of dangerousCode) {
        if (textContent.includes(code)) {
          console.error('[内容检测] ❌ 检测到恶意代码:', code);
          resolve({ valid: false, error: '文件内容包含非法脚本代码' });
          return;
        }
      }

      console.log('[内容检测] ✅ 内容检查通过');
      resolve({ valid: true });
    };

    reader.onerror = function () {
      console.error('[内容检测] ❌ 读取文件失败');
      resolve({ valid: false, error: '文件读取失败' });
    };

    reader.readAsArrayBuffer(blob);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCR 初始化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function initializeOCR() {
  if (isOCRReady) return;

  try {
    console.log('[OCR] 开始初始化...');

    // 只使用英文模型（身份证号只有数字和X）
    ocrWorker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        console.log('[OCR]', m.status, Math.round(m.progress * 100) + '%');
      }
    });

    isOCRReady = true;
    console.log('[OCR] ✅ 初始化完成');

  } catch (error) {
    console.error('[OCR] ❌ 初始化失败:', error);
    isOCRReady = false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCR 识别身份证（修复版 - 等待初始化完成）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function recognizeIDCard(imageFile) {
  // 如果OCR引擎未就绪，先初始化并等待完成
  if (!isOCRReady) {
    console.log('[OCR] 引擎未就绪，正在初始化...');
    await initializeOCR();

    // 如果初始化失败，返回null
    if (!isOCRReady) {
      console.error('[OCR] 引擎初始化失败');
      return null;
    }
  }

  try {
    console.log('[OCR] 开始识别身份证...');

    const { data: { text } } = await ocrWorker.recognize(imageFile);

    console.log('[OCR] 识别完成');
    console.log('[OCR] 原始文本:\n' + text);

    // 提取身份证号（18位数字或末尾X）
    const idNumber = extractIDNumber(text);

    if (idNumber) {
      console.log('[OCR] ✅ 提取到身份证号:', idNumber);
      return { idNumber };
    } else {
      console.log('[OCR] ⚠️ 未能识别出身份证号');
      return null;
    }

  } catch (error) {
    console.error('[OCR] ❌ 识别失败:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 提取身份证号（18位数字或末尾X）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractIDNumber(text) {
  // 清理文本（去除空格、换行）
  const cleanText = text.replace(/[\s\n\r]/g, '');

  // 正则：18位数字，或17位数字+X/x
  const idPattern = /\d{17}[\dXx]|\d{18}/g;
  const matches = cleanText.match(idPattern);

  if (matches && matches.length > 0) {
    // 返回第一个匹配的18位号码
    return matches[0].toUpperCase();
  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 页面加载时初始化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
  console.log('[KYC] 页面加载完成');

  // 立即开始初始化OCR（提前准备，避免用户等待）
  console.log('[KYC] 开始预加载OCR引擎...');
  initializeOCR();

  // 绑定文件选择事件（HTML中已经通过onclick绑定了点击事件）
  const idInput = document.getElementById('idInput');
  if (idInput) {
    idInput.addEventListener('change', handleIDUpload);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 处理身份证上传（自动触发OCR + 安全检测）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleIDUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  console.log('[Upload] 选择了文件:', file.name);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第1步：文件基础安全检测
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const basicCheck = validateFileSecure(file);
  if (!basicCheck.valid) {
    await showToast('安全检测失败', basicCheck.error);
    e.target.value = ''; // 清空选择
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第2步：文件内容安全检测
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const contentCheck = await validateFileContent(file);
  if (!contentCheck.valid) {
    await showToast('安全检测失败', contentCheck.error);
    e.target.value = ''; // 清空选择
    return;
  }

  console.log('[Upload] ✅ 安全检测通过');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第3步：压缩图片（优化OCR性能）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  let processedFile = file;
  try {
    console.log('[Upload] 开始压缩图片...');
    processedFile = await compressImage(file);
    console.log('[Upload] ✅ 图片压缩完成');
  } catch (error) {
    console.error('[Upload] ⚠️ 图片压缩失败，使用原图:', error);
    // 压缩失败也继续，使用原图
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第4步：显示图片预览
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const reader = new FileReader();
  reader.onload = function (event) {
    const previewImg = document.getElementById('previewImg');
    const imagePreview = document.getElementById('imagePreview');

    previewImg.src = event.target.result;
    imagePreview.classList.remove('hidden');
  };
  reader.readAsDataURL(processedFile);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第5步：自动触发OCR识别（使用压缩后的图片）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  showToast('', '正在识别身份证号，请稍候...');
  const result = await recognizeIDCard(processedFile);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 第6步：处理OCR结果
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!result || !result.idNumber) {
    // ❌ OCR识别失败 - 弹窗提示并清空上传
    console.log('[Upload] ❌ OCR识别失败，要求重新上传');

    // 清空所有状态，恢复上传按钮
    e.target.value = '';
    idCardImage = null;
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('uploadArea').style.display = '';  // 显示上传按钮

    // 弹窗提示用户重新上传
    await showToast('识别失败', '未能识别到身份证号码\n\n请重新上传清晰的证件照片');

    return;
  }

  // ✅ OCR识别成功
  console.log('[Upload] ✅ OCR识别成功，身份证号:', result.idNumber);

  // 保存压缩后的图片（用于后续上传）
  idCardImage = processedFile;

  // 隐藏上传占位符，显示图片预览
  document.getElementById('uploadPlaceholder').classList.add('hidden');
  document.getElementById('uploadArea').style.display = 'none';  // 隐藏上传按钮

  // 自动填充身份证号
  document.getElementById('idCardInput').value = result.idNumber;

  // 显示iOS原生风格弹窗
  const message = `身份证号已自动识别

${result.idNumber}

请确认无误后输入姓名`;

  await showToast('识别成功', message);

  // 聚焦到姓名输入框
  setTimeout(() => {
    document.getElementById('nameInput').focus();
  }, 300);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 步骤切换
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function goToStep2() {
  const name = document.getElementById('nameInput').value.trim();
  const idCard = document.getElementById('idCardInput').value.trim();

  if (!idCardImage) {
    showToast('提示', '请先上传身份证照片');
    return;
  }

  if (!name) {
    showToast('提示', '请输入真实姓名');
    return;
  }

  if (!idCard || idCard.length !== 18) {
    showToast('提示', '请输入正确的18位身份证号');
    return;
  }

  // 切换步骤
  currentStep = 2;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');

  document.getElementById('dot1').classList.remove('active');
  document.getElementById('dot2').classList.add('active');

  window.scrollTo(0, 0);
}

function goBackToStep1() {
  currentStep = 1;
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');

  document.getElementById('dot2').classList.remove('active');
  document.getElementById('dot1').classList.add('active');

  // 停止摄像头
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }

  window.scrollTo(0, 0);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 人脸识别
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startCamera() {
  try {
    const video = document.getElementById('faceVideo');
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });

    video.srcObject = videoStream;

    // 显示摄像头
    document.getElementById('capturePlaceholder').classList.add('hidden');
    document.getElementById('cameraView').classList.remove('hidden');
    document.getElementById('captureBtn').classList.remove('hidden');

  } catch (error) {
    console.error('摄像头启动失败:', error);
    await showToast('摄像头错误', '无法启动摄像头，请检查权限设置');
  }
}

function captureFace() {
  const video = document.getElementById('faceVideo');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    faceImage = blob;

    // 停止摄像头
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      videoStream = null;
    }

    // 隐藏摄像头和拍照按钮
    document.getElementById('cameraView').classList.add('hidden');
    document.getElementById('captureBtn').classList.add('hidden');

    // 直接显示提交按钮（不显示假的相似度）
    document.getElementById('submitBtn').classList.remove('hidden');

    await showToast('', '人脸采集成功，请提交验证');
  }, 'image/jpeg');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 提交认证（简化版 - 直接上传到后台审核）
// 不做自动人脸识别，由管理员手动审核
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function submitKYC() {
  const name = document.getElementById('nameInput').value.trim();
  const idCard = document.getElementById('idCardInput').value.trim();

  if (!idCardImage || !faceImage) {
    await showToast('提示', '请完成所有认证步骤');
    return;
  }

  // 显示加载提示
  await showToast('', '正在提交实名认证，请稍候...');

  const formData = new FormData();
  formData.append('real_name', name);
  formData.append('id_card', idCard);
  formData.append('id_card_file', idCardImage);  // 身份证照片
  formData.append('selfie', faceImage);     // 自拍照
  formData.append('token', TokenManager.getToken() || '');

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 调用简化版KYC提交API（直接提交审核，不做人脸识别）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const response = await fetch('https://api.4kp3l0iq.top/user/kyc-submit-simple', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    console.log('[KYC提交] API返回:', result);

    if (result.code === 1) {
      // ✅ 提交成功，等待审核
      console.log('[KYC提交] 提交成功，等待审核');

      await showToast('提交成功', '实名认证已提交！\n请耐心等待管理员审核');

      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 2000);

    } else {
      // ❌ 提交失败
      console.log('[KYC提交] 提交失败:', result.message);
      await showToast('提交失败', result.message || '提交失败，请稍后重试');
    }

  } catch (error) {
    console.error('[KYC提交] 请求失败:', error);
    await showToast('网络错误', '网络请求失败，请检查网络连接');
  }
}
