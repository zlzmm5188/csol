// ========================================
// PROVIDENCE前台 - API对接版本
// 基于 app.js 修改，对接后台API
// ========================================

// ========== 用户数据变量（全局） ==========
window.userData = {
  totalAsset: 0,
  totalIncome: 0,
  vipLevel: 1,
  loaded: false
};

(function(){
  const $ = (s)=>document.querySelector(s);

  // ========== 从后台API获取用户数据 ==========
  async function loadUserData() {
    try {
// console.log('📡 正在获取用户数据...'); // 性能优化：已注释
      const result = await API.user.getInfo();

      if (result.success && result.data) {
        const data = result.data;

        // 更新用户数据
        userData.totalAsset = parseFloat(data.money || 0);
        userData.totalIncome = parseFloat(data.integral || 0); // 用积分代替收益
        userData.vipLevel = parseInt(data.level || 1);
        userData.loaded = true;

        console.log('✅ 用户数据加载成功:', userData);
        updateUI();
      } else {
        console.warn('⚠️ 获取用户数据失败:', result.msg);
        // 使用默认数据
        updateUI();
      }
    } catch (err) {
      console.error('❌ 获取用户数据出错:', err);
      // 使用默认数据
      updateUI();
    }
  }

  // ========== 更新UI界面 ==========
  function updateUI(){
    // 更新总资产
    if($('#totalAsset')){
      $('#totalAsset').textContent = formatMoney(userData.totalAsset);
    }
    // 更新总收益
    if($('#totalIncome')){
      const income = userData.totalIncome;
      const sign = income >= 0 ? '' : '-';
      $('#totalIncome').textContent = sign + formatMoney(Math.abs(income));
    }
    // 更新VIP等级卡片
    const vipCard = $('.vipcard');
    if(vipCard && userData.vipLevel >= 1 && userData.vipLevel <= 10){
      vipCard.setAttribute('data-vip-level', Math.min(userData.vipLevel, 6));
    }
  }

  // ========== 金额格式化 ==========
  function formatMoney(num){
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ========== 市场数据更新 ==========
  function updateMarketData(){
    // 使用第三方API或本地数据
    const marketData = {
      sh: { value: 3245.67, change: 32.45, percent: 1.01 },
      sz: { value: 10823.45, change: -15.23, percent: -0.14 },
      hk: { value: 17856.32, change: 125.78, percent: 0.71 },
      nasdaq: { value: 14234.89, change: 56.32, percent: 0.40 }
    };

    Object.keys(marketData).forEach(key => {
      const data = marketData[key];
      const valueEl = document.querySelector(`[data-index="${key}"]`);
      const changeEl = document.querySelector(`[data-change="${key}"]`);

      if(valueEl) valueEl.textContent = data.value.toFixed(2);
      if(changeEl){
        const direction = data.change > 0 ? 'up' : (data.change < 0 ? 'down' : 'flat');
        changeEl.className = 'index-change ' + direction;
        changeEl.querySelector('.change-value').textContent = Math.abs(data.change).toFixed(2);
        changeEl.querySelector('.change-percent').textContent = `(${data.percent >= 0 ? '+' : ''}${data.percent.toFixed(2)}%)`;
      }
    });
  }

  // ========== 财经快讯更新 ==========
  function updateNews(){
    const news = [
      { time: '15:32', content: '央行宣布下调存款准备金率0.5个百分点，释放长期资金约1.2万亿元' },
      { time: '14:58', content: '沪深两市成交额突破1.2万亿元，创近3个月新高' },
      { time: '14:15', content: '美联储主席鲍威尔：将继续关注通胀数据，保持货币政策灵活性' },
      { time: '13:42', content: '国际油价大涨3.2%，布伦特原油突破85美元/桶' },
      { time: '13:08', content: '科技板块领涨，人工智能概念股集体走强' }
    ];

    const newsList = $('#newsList');
    if(newsList){
      const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const renderNews = () => {
        const currentTime = getCurrentTime();
        const newsHTML = news.map(n =>
          `<div class="news-item"><span class="news-time">${currentTime}</span><span class="news-content">${n.content}</span></div>`
        ).join('');
        newsList.innerHTML = newsHTML;
      };

      renderNews();
      setInterval(renderNews, 60000);

      setInterval(() => {
        const items = newsList.querySelectorAll('.news-item');
        items.forEach((item, idx) => {
          item.style.animation = 'none';
          setTimeout(() => {
            item.style.animation = `fadeInUp 3s ease-out forwards`;
            item.style.animationDelay = `${idx * 3}s`;
          }, 10);
        });
      }, 15000);
    }
  }

  // ========== 页面加载时初始化 ==========
  window.addEventListener('DOMContentLoaded', () => {
// console.log('🚀 PROVIDENCE前台启动 - API对接版本'); // 性能优化：已注释

    // 检查是否有Token（已登录）
    const token = http.getToken();
    if (token) {
// console.log('🔑 检测到Token，加载用户数据'); // 性能优化：已注释
      loadUserData();
    } else {
// console.log('⚠️ 未登录，使用默认数据'); // 性能优化：已注释
      updateUI();
    }

    // 初始化其他数据
    if($('#marketIndices')) updateMarketData();
    if($('#newsList')) updateNews();

    // 定时更新市场数据（每30秒）
    if($('#marketIndices')){
      setInterval(updateMarketData, 30000);
    }
  });

  // tabs
  const tabs = document.querySelectorAll('.tabbar .tab');
  tabs.forEach(t=>t.addEventListener('click',()=>{
    tabs.forEach(n=>n.classList.remove('active'));
    t.classList.add('active');
  }));
})();

// ========== 眼睛切换功能 ==========
let assetHidden = false;
function toggleAsset(){
  const assetEl = document.getElementById('totalAsset');
  const incomeEl = document.getElementById('totalIncome');
  const eyeEl = document.querySelector('.eye-toggle');
  if(!assetHidden){
    assetEl.textContent = '***,***.**';
    incomeEl.textContent = '***,***.**';
    eyeEl.textContent = '🙈';
    assetHidden = true;
  } else {
    const formatMoney = (num) => num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    assetEl.textContent = formatMoney(window.userData.totalAsset);
    const income = window.userData.totalIncome;
    const sign = income >= 0 ? '' : '-';
    incomeEl.textContent = sign + formatMoney(Math.abs(income));
    eyeEl.textContent = '👁';
    assetHidden = false;
  }
}

// 导出供其他页面使用
window.loadUserData = loadUserData;
