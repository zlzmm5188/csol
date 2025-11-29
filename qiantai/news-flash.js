// 财经快讯页面脚本 - 使用真实API
(function(){
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let currentCategory = 'all';
  let currentPage = 1;
  const pageSize = 10;
  let allNews = {}; // 缓存所有新闻数据
  let isLoading = false;

  // ========== 从API加载新闻 ==========
  async function fetchNewsFromAPI() {
    try {
      const response = await fetch(`data/news-data.json?t=${Date.now()}`);
      const result = await response.json();

      // 获取对应分类的新闻
      let newsList = currentCategory === 'all' ? result.all : (result[currentCategory] || result.all);

      if (!newsList || newsList.length === 0) {
        console.log('暂无新闻数据');
        return { list: [], hasMore: false, updateTime: new Date() };
      }

      // 分页处理
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pagedList = newsList.slice(start, end);
      const hasMore = end < newsList.length;

      return {
        list: pagedList,
        hasMore: hasMore,
        updateTime: new Date()
      };
    } catch (error) {
      console.error('获取新闻失败:', error);
      return null;
    }
  }

  // ========== 分类筛选 ==========
  const filterBtns = $$('.news-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      currentPage = 1;
      loadNews(true);
    });
  });

  // ========== 渲染新闻列表 ==========
  function renderNews(newsList, reset = false) {
    const listEl = $('#newsFlashList');
    if (reset) {
      listEl.innerHTML = '';
    }

    if (!newsList || newsList.length === 0) {
      if (reset) {
        listEl.innerHTML = '<div class="no-data">暂无新闻数据</div>';
      }
      return;
    }

    newsList.forEach(news => {
      const item = document.createElement('div');
      item.className = 'flash-item';
      item.dataset.newsId = news.id;

      // 重要性标识
      let importanceBadge = '';
      if (news.importance === 'high') {
        importanceBadge = '<span class="importance-badge high">重要</span>';
      } else if (news.importance === 'medium') {
        importanceBadge = '<span class="importance-badge medium">关注</span>';
      }

      // 格式化阅读数
      let viewsText = news.views;
      if (typeof news.views === 'number') {
        if (news.views >= 10000) {
          viewsText = (news.views / 10000).toFixed(1) + '万';
        }
      }

      item.innerHTML = `
        <div class="flash-time">${news.time}</div>
        <div class="flash-content">
          ${importanceBadge}
          <div class="flash-title">${news.title}</div>
          <div class="flash-desc">${news.desc || ''}</div>
          <div class="flash-meta">
            <span class="flash-source">📰 ${news.source}</span>
            <span class="flash-views">👁️ ${viewsText}</span>
          </div>
          ${news.tags && news.tags.length > 0 ? `
          <div class="flash-tags">
            ${news.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          ` : ''}
        </div>
      `;
      listEl.appendChild(item);
    });

    addClickEvents();
  }

  // ========== 加载新闻 ==========
  async function loadNews(reset = false) {
    if (isLoading) return;

    isLoading = true;
    const loadMoreBtn = $('#loadMoreNews');
    const originalText = loadMoreBtn.textContent;
    loadMoreBtn.textContent = '加载中...';
    loadMoreBtn.disabled = true;

    try {
      const data = await fetchNewsFromAPI();

      if (data && data.list) {
        renderNews(data.list, reset);

        // 更新更新时间
        const updateTimeEl = $('#updateTime');
        if (updateTimeEl && data.updateTime) {
          const time = new Date(data.updateTime);
          updateTimeEl.textContent = `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
        }

        // 更新加载更多按钮
        if (data.hasMore) {
          loadMoreBtn.textContent = '加载更多';
          loadMoreBtn.disabled = false;
        } else {
          loadMoreBtn.textContent = '已加载全部';
          loadMoreBtn.disabled = true;
        }
      } else {
        loadMoreBtn.textContent = originalText;
        loadMoreBtn.disabled = false;
      }
    } catch (error) {
      console.error('加载新闻失败:', error);
      loadMoreBtn.textContent = '加载失败，点击重试';
      loadMoreBtn.disabled = false;
    } finally {
      isLoading = false;
    }
  }

  // ========== 添加点击事件 ==========
  function addClickEvents() {
    const items = $$('.flash-item[data-news-id]');
    items.forEach(item => {
      if (!item.dataset.hasListener) {
        item.dataset.hasListener = 'true';
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
          // 取消详情页功能，点击无效
          return false;
        });
      }
    });
  }

  // ========== 加载更多 ==========
  $('#loadMoreNews').addEventListener('click', () => {
    currentPage++;
    loadNews(false);
  });

  // ========== 自动刷新 ==========
  function autoRefresh() {
    // 每5分钟自动刷新一次
    setInterval(() => {
      if (currentPage === 1 && currentCategory === 'all') {
        console.log('自动刷新新闻...');
        loadNews(true);
      }
    }, 5 * 60 * 1000);
  }

  // ========== 更新时间显示 ==========
  function updateTimeDisplay() {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updateTimeEl = $('#updateTime');
    if (updateTimeEl && !updateTimeEl.dataset.fromApi) {
      updateTimeEl.textContent = timeStr;
    }
  }

  // ========== 手动刷新 ==========
  const liveIndicator = $('.live-indicator');
  if (liveIndicator) {
    liveIndicator.style.cursor = 'pointer';
    liveIndicator.addEventListener('click', () => {
      currentPage = 1;
      loadNews(true);
    });
  }

  // ========== 初始化 ==========
  loadNews(true);
  setInterval(updateTimeDisplay, 60000); // 每分钟更新一次显示时间
  autoRefresh(); // 启动自动刷新
})();
