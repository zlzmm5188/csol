// Providence 人脸识别认证 API 工具类
// 根据高级功能对接文档 v1.0

(function() {
    if (window.__FACE_RECOGNITION_API_JS__) return;
    window.__FACE_RECOGNITION_API_JS__ = true;

    console.log('[FaceRecognitionAPI] 加载 v1.0');

    const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';

    async function apiRequest(endpoint, options = {}) {
        const token = window.TokenManager?.getToken() || localStorage.getItem('providence_token') || '';
        if (!token && !options.skipAuth) {
            throw new Error('未登录');
        }

        const url = API_BASE + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Token'] = token;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            const result = await response.json();

            if (result.code === 401 || (result.code === -1 && result.msg && result.msg.includes('登录'))) {
                localStorage.clear();
                window.location.href = 'login.html';
                throw new Error('登录已过期');
            }

            return result;
        } catch (error) {
            console.error('[FaceRecognitionAPI] 请求失败:', error);
            throw error;
        }
    }

    // 人脸识别API
    window.FaceRecognitionAPI = {
        // 1. 上传人脸照片（通用接口）
        // POST /api/user/face-upload
        async uploadFaceImage(imageData) {
            // imageData 可以是 base64 字符串或 File 对象
            let base64Data = imageData;

            if (imageData instanceof File) {
                base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageData);
                });
            }

            // 移除 data:image/jpeg;base64, 前缀（如果有）
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }

            const result = await apiRequest('/user/face-upload', {
                method: 'POST',
                body: JSON.stringify({
                    face_image: base64Data
                })
            });

            if (result.code === 1) {
                return result.data;
            }
            throw new Error(result.msg || '上传人脸照片失败');
        },

        // 2. 人脸识别验证（通用接口）
        // POST /api/user/face-verify
        async verifyFace(scene, faceImage) {
            // scene: 'general' | 'withdraw' | 'login'
            let base64Data = faceImage;

            if (faceImage instanceof File) {
                base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(faceImage);
                });
            }

            // 移除 data:image/jpeg;base64, 前缀
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }

            const result = await apiRequest('/user/face-verify', {
                method: 'POST',
                body: JSON.stringify({
                    scene: scene || 'general',
                    face_image: base64Data
                })
            });

            if (result.code === 1) {
                return {
                    verified: result.data.verified || true,
                    similarity: result.data.similarity || 0,
                    liveness_score: result.data.liveness_score || 0,
                    message: result.data.message || '验证成功'
                };
            }
            throw new Error(result.msg || '人脸验证失败');
        },

        // 3. 获取人脸照片状态
        // GET /api/user/face/status
        async getFaceStatus() {
            const result = await apiRequest('/user/face/status', {
                method: 'GET'
            });

            if (result.code === 1) {
                return result.data;
            }
            throw new Error(result.msg || '获取状态失败');
        },

        // 4. 上传人脸照片（用于KYC实名认证）
        // POST /api/user/kyc/submit
        async uploadFaceForKyc(faceImage, realName, idCard, idCardFront = null, idCardBack = null) {
            let base64Data = faceImage;

            if (faceImage instanceof File) {
                base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(faceImage);
                });
            }

            // 移除 data:image/jpeg;base64, 前缀（如果有）
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }

            const result = await apiRequest('/user/kyc/submit', {
                method: 'POST',
                body: JSON.stringify({
                    real_name: realName,
                    id_card: idCard,
                    face_photo: base64Data,
                    id_card_front: idCardFront,
                    id_card_back: idCardBack
                })
            });

            if (result.code === 1) {
                return {
                    is_kyc: result.data.is_kyc || 0,
                    message: result.data.message || '提交成功',
                    face_verify: result.data.face_verify || {}
                };
            }
            throw new Error(result.msg || '提交实名认证失败');
        },

        // 5. 人脸识别验证（用于找回密码）
        // POST /api/auth/forgot-password/step2
        async verifyFaceForPasswordReset(userId, verifyToken, faceImage) {
            let base64Data = faceImage;

            if (faceImage instanceof File) {
                base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(faceImage);
                });
            }

            // 移除 data:image/jpeg;base64, 前缀
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }

            const result = await apiRequest('/auth/forgot-password/step2', {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({
                    user_id: userId,
                    verify_token: verifyToken,
                    face_photo: base64Data
                })
            });

            if (result.code === 1) {
                return {
                    reset_token: result.data.reset_token,
                    expires_in: result.data.expires_in || 3600
                };
            }
            throw new Error(result.msg || '人脸验证失败');
        },

        // 6. 获取KYC状态
        // GET /api/user/kyc/status
        async getKycStatus() {
            const result = await apiRequest('/user/kyc/status', {
                method: 'GET'
            });

            if (result.code === 1) {
                return result.data;
            }
            throw new Error(result.msg || '获取状态失败');
        },

        // 辅助函数：从摄像头拍照
        async captureFromCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    }
                });

                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;

                return new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);

                        // 停止摄像头
                        stream.getTracks().forEach(track => track.stop());

                        // 转换为 base64
                        const imageData = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(imageData);
                    };
                    video.onerror = reject;
                });
            } catch (error) {
                throw new Error('无法访问摄像头: ' + error.message);
            }
        },

        // 辅助函数：从文件选择
        async selectFromFile() {
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    } else {
                        reject(new Error('未选择文件'));
                    }
                };
                input.click();
            });
        }
    };

    console.log('[FaceRecognitionAPI] 初始化完成');
})();
