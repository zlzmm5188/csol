// 财经日历页面脚本 - 使用真实API
(function(){
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let currentDate = new Date();
  let currentType = 'data'; // data, event, holiday
  let currentRegion = 'all';
  let currentImportance = 'all';
  let isLoading = false;

  // ========== 国旗/图标映射 ==========
  const regionFlags = {
    'cn': '🇨🇳',
    'us': '🇺🇸',
    'eu': '🇪🇺',
    'jp': '🇯🇵',
    'uk': '🇬🇧',
    'au': '🇦🇺',
    'ca': '🇨🇦'
  };

  // ========== 从API加载数据 ==========
  async function fetchCalendarFromAPI(date, type, region, importance) {
    try {
      const params = new URLSearchParams({
        action: 'get',
        date: date,
        type: type,
        region: region,
        importance: importance
      });

      const response = await fetch(`calendar-crawler.php?${params}`);
      const result = await response.json();

      if (result.code === 0) {
        return result.data;
      } else {
        console.error('API返回错误:', result.message);
        return null;
      }
    } catch (error) {
      console.error('获取日历数据失败:', error);
      return null;
    }
  }

  // ========== 筛选器事件 ==========
  $$('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;
      renderEvents();
    });
  });

  $('#regionFilter').addEventListener('change', (e) => {
    currentRegion = e.target.value;
    renderEvents();
  });

  $('#importanceFilter').addEventListener('change', (e) => {
    currentImportance = e.target.value;
    renderEvents();
  });

  // ========== 日期导航 ==========
  function updateDateDisplay() {
    const dateStr = formatDate(currentDate);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[currentDate.getDay()];

    // 判断是否是今天
    const today = new Date();
    const isToday = dateStr === formatDate(today);

    $('#currentDate').textContent = isToday ? `${dateStr} ${weekday} (今天)` : `${dateStr} ${weekday}`;
  }

  $('#prevDay').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay();
    renderEvents();
  });

  $('#nextDay').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay();
    renderEvents();
  });

  $('#todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    updateDateDisplay();
    renderEvents();
  });

  // ========== 格式化日期 ==========
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ========== 渲染事件列表 ==========
  async function renderEvents() {
    if (isLoading) return;

    isLoading = true;
    const eventsContainer = $('#calendarEvents');

    // 显示加载动画
    eventsContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
    `;

    const dateKey = formatDate(currentDate);
    const data = await fetchCalendarFromAPI(dateKey, currentType, currentRegion, currentImportance);

    isLoading = false;

    if (!data || !data.events || data.events.length === 0) {
      eventsContainer.innerHTML = `
        <div class="no-events">
          <div class="no-events-icon">📅</div>
          <div class="no-events-text">当天无相关事件</div>
          <div class="no-events-hint">请尝试切换日期或调整筛选条件</div>
        </div>
      `;
      return;
    }

    const events = data.events;
    let html = '<div class="events-list">';

    events.forEach(event => {
      const flag = regionFlags[event.region] || '🌐';
      const importanceClass = `importance-${event.importance}`;
      const importanceStars = event.importance === 'high' ? '★★★' :
                             event.importance === 'medium' ? '★★' : '★';

      if (event.type === 'holiday') {
        html += `
          <div class="event-item holiday-item">
            <div class="event-header">
              <div class="event-time">${event.time}</div>
              <div class="event-country">${flag} ${event.country}</div>
            </div>
            <div class="event-body">
              <div class="event-name">🏖️ ${event.event}</div>
            </div>
          </div>
        `;
      } else if (event.type === 'event') {
        html += `
          <div class="event-item event-item-special">
            <div class="event-header">
              <div class="event-time">${event.time}</div>
              <div class="event-country">${flag} ${event.country}</div>
              <div class="event-importance ${importanceClass}">${importanceStars}</div>
            </div>
            <div class="event-body">
              <div class="event-name">🎤 ${event.event}</div>
              ${event.source ? `<div class="event-source">来源: ${event.source}</div>` : ''}
            </div>
          </div>
        `;
      } else {
        // 格式化数值，添加单位
        const formatValue = (val, unit) => {
          if (val === '--' || val === '') return '--';
          return unit ? `${val}` : val;
        };

        html += `
          <div class="event-item">
            <div class="event-header">
              <div class="event-time">${event.time}</div>
              <div class="event-country">${flag} ${event.country}</div>
              <div class="event-importance ${importanceClass}">${importanceStars}</div>
            </div>
            <div class="event-body">
              <div class="event-name">${event.event}${event.unit ? ' (' + event.unit + ')' : ''}</div>
              <div class="event-data">
                <div class="data-item">
                  <span class="data-label">实际</span>
                  <span class="data-value actual">${formatValue(event.actual, event.unit)}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">预测</span>
                  <span class="data-value forecast">${formatValue(event.forecast, event.unit)}</span>
                </div>
                <div class="data-item">
                  <span class="data-label">前值</span>
                  <span class="data-value previous">${formatValue(event.previous, event.unit)}</span>
                </div>
              </div>
              ${event.source ? `<div class="event-source">来源: ${event.source}</div>` : ''}
            </div>
          </div>
        `;
      }
    });

    html += '</div>';

    // 添加更新时间
    if (data.updateTime) {
      html += `
        <div class="update-info">
          <div class="update-text">数据更新时间: ${data.updateTime}</div>
          <button class="refresh-btn" onclick="location.reload()">🔄 刷新</button>
        </div>
      `;
    }

    eventsContainer.innerHTML = html;
  }

  // ========== 自动刷新 ==========
  function startAutoRefresh() {
    // 每小时自动刷新一次
    setInterval(() => {
      const today = new Date();
      if (formatDate(currentDate) === formatDate(today)) {
// console.log('自动刷新日历数据...'); // 性能优化：已注释
        renderEvents();
      }
    }, 60 * 60 * 1000); // 1小时
  }

  // ========== 初始化 ==========
  updateDateDisplay();
  renderEvents();
  startAutoRefresh();
})();
