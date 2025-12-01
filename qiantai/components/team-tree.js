/**
 * Providence Team Tree Component
 * Visualizes team hierarchy with downlines
 * Shows: subordinates' recharge, withdrawal data, and team count
 */

class TeamTreeComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('[TeamTree] Container not found:', containerId);
            return;
        }
        
        this.options = {
            maxDepth: options.maxDepth || 2,
            showInternal: options.showInternal || false,
            animateExpand: options.animateExpand !== false,
            theme: options.theme || 'dark',
            ...options
        };
        
        this.treeData = null;
        this.expandedNodes = new Set();
        
        this.init();
    }
    
    init() {
        this.container.innerHTML = this.getBaseHTML();
        this.addStyles();
        this.bindEvents();
    }
    
    getBaseHTML() {
        return `
            <div class="team-tree-container ${this.options.theme}">
                <div class="tree-header">
                    <h3 class="tree-title">团队架构</h3>
                    <div class="tree-legend">
                        <span class="legend-item"><span class="legend-dot normal"></span>正常成员</span>
                        <span class="legend-item"><span class="legend-dot internal"></span>内部员工</span>
                    </div>
                </div>
                <div class="tree-content" id="treeContent">
                    <div class="tree-loading">
                        <div class="loading-spinner"></div>
                        <span>加载团队数据...</span>
                    </div>
                </div>
                <div class="tree-summary" id="treeSummary"></div>
            </div>
        `;
    }
    
    addStyles() {
        if (document.getElementById('team-tree-styles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'team-tree-styles';
        styleEl.textContent = `
            .team-tree-container {
                background: linear-gradient(135deg, rgba(20, 30, 45, 0.95), rgba(30, 45, 65, 0.95));
                border-radius: 16px;
                padding: 20px;
                color: #fff;
            }
            
            .team-tree-container.dark {
                background: linear-gradient(135deg, rgba(20, 30, 45, 0.95), rgba(30, 45, 65, 0.95));
            }
            
            .tree-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            
            .tree-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
                color: #d4af37;
            }
            
            .tree-legend {
                display: flex;
                gap: 15px;
                font-size: 12px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
                color: rgba(255,255,255,0.7);
            }
            
            .legend-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .legend-dot.normal {
                background: #10b981;
            }
            
            .legend-dot.internal {
                background: #6b7280;
            }
            
            .tree-content {
                min-height: 200px;
            }
            
            .tree-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                color: rgba(255,255,255,0.6);
            }
            
            .loading-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid rgba(212, 175, 55, 0.3);
                border-top-color: #d4af37;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Tree Node Styles */
            .tree-node {
                margin-left: 20px;
                border-left: 2px solid rgba(212, 175, 55, 0.3);
                padding-left: 15px;
                margin-bottom: 8px;
            }
            
            .tree-node:first-child {
                margin-left: 0;
                border-left: none;
                padding-left: 0;
            }
            
            .tree-node.level-1 {
                margin-left: 0;
                border-left: none;
                padding-left: 0;
            }
            
            .tree-node.level-2 {
                border-color: rgba(100, 150, 200, 0.4);
            }
            
            .node-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 12px 15px;
                margin-bottom: 10px;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            
            .node-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(212, 175, 55, 0.3);
            }
            
            .node-card.internal {
                opacity: 0.6;
                border-left: 3px solid #6b7280;
            }
            
            .node-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .node-user {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .node-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, #d4af37, #f4d03f);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
                color: #0e2b44;
            }
            
            .node-info {
                display: flex;
                flex-direction: column;
            }
            
            .node-name {
                font-weight: 600;
                font-size: 14px;
            }
            
            .node-id {
                font-size: 11px;
                color: rgba(255,255,255,0.5);
            }
            
            .node-vip {
                background: linear-gradient(135deg, #d4af37, #f4d03f);
                color: #0e2b44;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
            }
            
            .node-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-label {
                font-size: 10px;
                color: rgba(255,255,255,0.5);
                margin-bottom: 2px;
            }
            
            .stat-value {
                font-size: 13px;
                font-weight: 600;
                color: #d4af37;
            }
            
            .stat-value.negative {
                color: #ef4444;
            }
            
            .node-expand {
                display: flex;
                align-items: center;
                gap: 5px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                transition: color 0.2s;
            }
            
            .node-expand:hover {
                color: #d4af37;
            }
            
            .node-expand .icon {
                transition: transform 0.3s;
            }
            
            .node-expand.expanded .icon {
                transform: rotate(90deg);
            }
            
            .node-children {
                overflow: hidden;
                max-height: 0;
                opacity: 0;
                transition: max-height 0.3s ease, opacity 0.3s ease;
            }
            
            .node-children.expanded {
                max-height: 2000px;
                opacity: 1;
            }
            
            .internal-badge {
                background: #6b7280;
                color: #fff;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 9px;
                margin-left: 5px;
            }
            
            /* Summary Styles */
            .tree-summary {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
            }
            
            .summary-item {
                text-align: center;
                padding: 15px;
                background: rgba(255,255,255,0.03);
                border-radius: 10px;
            }
            
            .summary-value {
                font-size: 20px;
                font-weight: 700;
                color: #d4af37;
                margin-bottom: 5px;
            }
            
            .summary-label {
                font-size: 11px;
                color: rgba(255,255,255,0.6);
            }
            
            .empty-state {
                text-align: center;
                padding: 40px;
                color: rgba(255,255,255,0.5);
            }
            
            .empty-icon {
                font-size: 40px;
                margin-bottom: 10px;
            }
            
            @media (max-width: 480px) {
                .summary-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .node-stats {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const expandBtn = e.target.closest('.node-expand');
            if (expandBtn) {
                this.toggleNode(expandBtn);
            }
        });
    }
    
    toggleNode(btn) {
        const nodeId = btn.dataset.nodeId;
        const childrenContainer = btn.nextElementSibling;
        
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
            btn.classList.remove('expanded');
            childrenContainer.classList.remove('expanded');
        } else {
            this.expandedNodes.add(nodeId);
            btn.classList.add('expanded');
            childrenContainer.classList.add('expanded');
        }
    }
    
    /**
     * Load and render tree data
     * @param {Object} data - Tree data from API
     */
    setData(data) {
        this.treeData = data;
        this.render();
    }
    
    render() {
        const content = document.getElementById('treeContent');
        const summary = document.getElementById('treeSummary');
        
        if (!this.treeData || !this.treeData.children || this.treeData.children.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div>暂无团队成员</div>
                    <div style="font-size:12px;margin-top:5px;">邀请好友加入您的团队</div>
                </div>
            `;
            summary.innerHTML = '';
            return;
        }
        
        content.innerHTML = this.renderNodes(this.treeData.children, 1);
        summary.innerHTML = this.renderSummary();
    }
    
    renderNodes(nodes, level) {
        if (!nodes || nodes.length === 0) return '';
        
        return nodes.map(node => {
            const isInternal = node.isInternal;
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = this.expandedNodes.has(String(node.id));
            
            // Skip internal members if option is set
            if (isInternal && !this.options.showInternal) return '';
            
            const avatar = this.getAvatar(node.username || node.realname);
            const holding = (node.recharges || 0) - (node.withdraws || 0);
            
            return `
                <div class="tree-node level-${level}">
                    <div class="node-card ${isInternal ? 'internal' : ''}">
                        <div class="node-header">
                            <div class="node-user">
                                <div class="node-avatar">${avatar}</div>
                                <div class="node-info">
                                    <span class="node-name">
                                        ${node.username || node.realname || '用户' + node.id}
                                        ${isInternal ? '<span class="internal-badge">内部</span>' : ''}
                                    </span>
                                    <span class="node-id">ID: ${node.uid || node.id}</span>
                                </div>
                            </div>
                            <span class="node-vip">VIP${node.vipLevel || 0}</span>
                        </div>
                        <div class="node-stats">
                            <div class="stat-item">
                                <div class="stat-label">累计充值</div>
                                <div class="stat-value">¥${this.formatMoney(node.recharges || 0)}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">累计提现</div>
                                <div class="stat-value">¥${this.formatMoney(node.withdraws || 0)}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">当前持仓</div>
                                <div class="stat-value ${holding < 0 ? 'negative' : ''}">¥${this.formatMoney(holding)}</div>
                            </div>
                        </div>
                        ${hasChildren ? `
                            <div class="node-expand ${isExpanded ? 'expanded' : ''}" data-node-id="${node.id}">
                                <span class="icon">▶</span>
                                <span>下级成员 (${node.children.length}人)</span>
                            </div>
                            <div class="node-children ${isExpanded ? 'expanded' : ''}">
                                ${this.renderNodes(node.children, level + 1)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderSummary() {
        if (!this.treeData) return '';
        
        // Calculate totals
        let totalMembers = 0;
        let countingMembers = 0;
        let totalRecharges = 0;
        let totalWithdrawals = 0;
        
        const calcStats = (nodes) => {
            if (!nodes) return;
            nodes.forEach(node => {
                totalMembers++;
                if (!node.isInternal) {
                    countingMembers++;
                    totalRecharges += node.recharges || 0;
                    totalWithdrawals += node.withdraws || 0;
                }
                if (node.children) {
                    calcStats(node.children);
                }
            });
        };
        
        calcStats(this.treeData.children);
        
        const totalHolding = totalRecharges - totalWithdrawals;
        
        return `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">${countingMembers}</div>
                    <div class="summary-label">有效成员</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">¥${this.formatMoney(totalRecharges)}</div>
                    <div class="summary-label">团队充值</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">¥${this.formatMoney(totalWithdrawals)}</div>
                    <div class="summary-label">团队提现</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">¥${this.formatMoney(totalHolding)}</div>
                    <div class="summary-label">团队持仓</div>
                </div>
            </div>
        `;
    }
    
    getAvatar(name) {
        if (!name) return '👤';
        const firstChar = String(name).charAt(0).toUpperCase();
        return /[A-Z]/.test(firstChar) ? firstChar : firstChar;
    }
    
    formatMoney(amount) {
        const num = parseFloat(amount) || 0;
        if (Math.abs(num) >= 10000) {
            return (num / 10000).toFixed(2) + '万';
        }
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    /**
     * Fetch and display team tree from API
     * @param {number} userId - User ID
     */
    async loadFromAPI(userId) {
        const content = document.getElementById('treeContent');
        content.innerHTML = `
            <div class="tree-loading">
                <div class="loading-spinner"></div>
                <span>加载团队数据...</span>
            </div>
        `;
        
        try {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const token = localStorage.getItem('providence_token') || '';
            
            const response = await fetch(`${API_BASE}/api/team/tree?user_id=${userId}&max_depth=${this.options.maxDepth}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Token': token
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.code === 1 && result.data) {
                    this.setData(result.data);
                    return;
                }
            }
            
            // Fallback to mock data for demo
            this.setData(this.getMockData());
        } catch (error) {
            console.error('[TeamTree] Load failed:', error);
            // Use mock data for demo
            this.setData(this.getMockData());
        }
    }
    
    getMockData() {
        return {
            rootUserId: 1,
            maxDepth: 2,
            totalNodes: 5,
            children: [
                {
                    id: 10001234,
                    uid: '10001234',
                    username: '张三',
                    vipLevel: 3,
                    isInternal: false,
                    recharges: 150000,
                    withdraws: 30000,
                    children: [
                        {
                            id: 10002345,
                            uid: '10002345',
                            username: '李四',
                            vipLevel: 2,
                            isInternal: false,
                            recharges: 50000,
                            withdraws: 10000
                        }
                    ]
                },
                {
                    id: 10003456,
                    uid: '10003456',
                    username: '王五',
                    vipLevel: 1,
                    isInternal: false,
                    recharges: 30000,
                    withdraws: 5000
                },
                {
                    id: 10004567,
                    uid: '10004567',
                    username: '内部员工A',
                    vipLevel: 0,
                    isInternal: true,
                    recharges: 100000,
                    withdraws: 20000
                }
            ]
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamTreeComponent;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.TeamTreeComponent = TeamTreeComponent;
}
