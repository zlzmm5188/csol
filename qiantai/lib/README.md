# Providence 前端开发库

## 📦 已安装的CSS/JS库

### JavaScript 库

#### 1. **Axios** (HTTP客户端)
- 文件: `lib/js/axios.min.js`
- 用途: API请求、HTTP客户端
- 使用:
```javascript
import axios from './lib/js/axios.min.js';
// 或
<script src="lib/js/axios.min.js"></script>
axios.get('/api/user/info').then(res => console.log(res.data));
```

#### 2. **Lodash** (工具函数库)
- 文件: `lib/js/lodash.min.js`
- 用途: 数组、对象、字符串等工具函数
- 使用:
```javascript
<script src="lib/js/lodash.min.js"></script>
const _ = window._;
const result = _.debounce(fn, 300);
```

#### 3. **Day.js** (日期处理)
- 文件: `lib/js/dayjs.min.js`
- 用途: 轻量级日期处理库
- 使用:
```javascript
<script src="lib/js/dayjs.min.js"></script>
const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
```

#### 4. **Swiper** (轮播图)
- 文件: `lib/css/swiper-bundle.min.css`, `lib/js/swiper-bundle.min.js`
- 用途: 移动端轮播、滑动组件
- 使用:
```html
<link rel="stylesheet" href="lib/css/swiper-bundle.min.css">
<script src="lib/js/swiper-bundle.min.js"></script>
```

#### 5. **Chart.js** (图表库)
- 文件: `lib/js/chart.umd.min.js`
- 用途: 数据可视化、图表绘制
- 使用:
```javascript
<script src="lib/js/chart.umd.min.js"></script>
const ctx = document.getElementById('myChart');
new Chart(ctx, { type: 'line', data: {...} });
```

#### 6. **SweetAlert2** (弹窗库)
- 文件: `lib/css/sweetalert2.min.css`, `lib/js/sweetalert2.min.js`
- 用途: 美观的弹窗提示
- 使用:
```html
<link rel="stylesheet" href="lib/css/sweetalert2.min.css">
<script src="lib/js/sweetalert2.min.js"></script>
<script>
Swal.fire('成功', '操作完成', 'success');
</script>
```

#### 7. **AOS** (滚动动画)
- 文件: `lib/css/aos.css`, `lib/js/aos.js`
- 用途: 滚动时触发动画
- 使用:
```html
<link rel="stylesheet" href="lib/css/aos.css">
<script src="lib/js/aos.js"></script>
<div data-aos="fade-up">内容</div>
```

#### 8. **GSAP** (动画库)
- 文件: `lib/js/gsap.min.js`
- 用途: 专业动画库
- 使用:
```javascript
<script src="lib/js/gsap.min.js"></script>
gsap.to('.element', { x: 100, duration: 1 });
```

#### 9. **QRCode** (二维码生成)
- 文件: `lib/js/qrcode.min.js`
- 用途: 生成二维码
- 使用:
```javascript
<script src="lib/js/qrcode.min.js"></script>
QRCode.toCanvas(canvas, 'https://example.com');
```

#### 10. **CryptoJS** (加密库)
- 文件: `lib/js/crypto-js.js`
- 用途: 加密解密、哈希
- 使用:
```javascript
<script src="lib/js/crypto-js.js"></script>
const hash = CryptoJS.MD5('text').toString();
```

#### 11. **Validator** (验证库)
- 文件: `lib/js/validator.min.js`
- 用途: 表单验证
- 使用:
```javascript
<script src="lib/js/validator.min.js"></script>
validator.isEmail('test@example.com');
```

#### 12. **Numeral** (数字格式化)
- 文件: `lib/js/numeral.min.js`
- 用途: 数字格式化
- 使用:
```javascript
<script src="lib/js/numeral.min.js"></script>
numeral(1000).format('0,0'); // "1,000"
```

### CSS 库

#### 1. **Animate.css** (动画库)
- 文件: `lib/css/animate.min.css`
- 用途: CSS动画类
- 使用:
```html
<link rel="stylesheet" href="lib/css/animate.min.css">
<div class="animate__animated animate__fadeIn">内容</div>
```

## 📁 目录结构

```
lib/
├── css/
│   ├── animate.min.css
│   ├── swiper-bundle.min.css
│   ├── sweetalert2.min.css
│   └── aos.css
└── js/
    ├── axios.min.js
    ├── lodash.min.js
    ├── dayjs.min.js
    ├── swiper-bundle.min.js
    ├── chart.umd.min.js
    ├── sweetalert2.min.js
    ├── aos.js
    ├── gsap.min.js
    ├── qrcode.min.js
    ├── crypto-js.js
    ├── validator.min.js
    └── numeral.min.js
```

## 🚀 快速使用示例

### 在HTML中引入

```html
<!DOCTYPE html>
<html>
<head>
    <!-- CSS库 -->
    <link rel="stylesheet" href="lib/css/animate.min.css">
    <link rel="stylesheet" href="lib/css/sweetalert2.min.css">

    <!-- JavaScript库 -->
    <script src="lib/js/axios.min.js"></script>
    <script src="lib/js/dayjs.min.js"></script>
    <script src="lib/js/sweetalert2.min.js"></script>
</head>
<body>
    <script>
        // 使用Axios
        axios.get('/api/data').then(res => {
            console.log(res.data);
        });

        // 使用Day.js
        console.log(dayjs().format('YYYY-MM-DD'));

        // 使用SweetAlert2
        Swal.fire('Hello', 'World', 'success');
    </script>
</body>
</html>
```

## 📝 版本信息

- **Axios**: 1.6.8
- **Lodash**: 4.17.21
- **Day.js**: 1.11.10
- **Swiper**: 11.1.4
- **Chart.js**: 4.4.3
- **SweetAlert2**: 11.10.7
- **Animate.css**: 4.1.1
- **AOS**: 2.3.4
- **GSAP**: 3.12.5

## ⚠️ 注意事项

1. 所有库文件已复制到 `lib/` 目录
2. 可以直接在HTML中引用
3. 建议使用版本号参数避免缓存: `?v=1.0.0`
4. 生产环境建议使用CDN或压缩版本

---

**创建时间**: 2025-01-XX
**Node版本**: 检查 `node -v`
**NPM版本**: 检查 `npm -v`
