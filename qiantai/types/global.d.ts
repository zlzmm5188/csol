// Providence 前端全局类型定义

// ============================================
// API 相关类型
// ============================================

interface APIConfig {
  SPLASH_DOMAIN: string;
  baseURL: string;
  adminURL: string;
  tokenKey: string;
  timeout: number;
  debug: boolean;
}

interface APIResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

// ============================================
// 用户相关类型
// ============================================

interface UserData {
  id: number;
  uid: string;
  username: string;
  email?: string;
  mobile?: string;
  realname?: string;
  avatar?: string;
  vip_level: number;
  level?: number;
  realname_status: number;
  status: number;
  token?: string;

  // 余额信息
  balance_cny: number;
  money?: number;
  frozen_cny: number;
  total_income_cny: number;

  balance_usdt: number;
  usdt_money?: number;
  usdt?: number;
  frozen_usdt: number;
  total_income_usdt: number;

  // 日利宝
  ribao_balance: number;
  ribao?: number;
  ribao_total_profit: number;
  ribao_yesterday_profit: number;

  // 积分
  points: number;

  // 投资统计
  total_invest: number;
  active_count: number;
  projects_count?: number;
  total_profit: number;
  profit?: number;

  // 团队统计
  team_count: number;
  team_performance: number;
  team_total_invest?: number;

  // 邀请信息
  invite_code?: string;

  created_at: string;
}

// ============================================
// 项目相关类型
// ============================================

interface Project {
  id: number;
  project_code: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  currency: 'CNY' | 'USDT';
  cover_image?: string;
  images?: string[];

  cycle_days: number;

  // 收益率
  rate: number;
  vip_rate: number;
  added: number;
  gift: number;
  total_rate: number;

  // 投资限额
  min_invest: number;
  max_invest: number;

  // 募集信息
  total: number;
  schedule: number;
  sold: number;
  remain: number;

  risk_level: number;
  view_count: number;
  invest_count: number;
  status: number;

  manager?: {
    id: number;
    name: string;
    title: string;
    avatar?: string;
    bio?: string;
  };
}

interface InvestOrder {
  id: number;
  order_no: string;
  user_id: number;
  project_id: number;
  project_title: string;
  amount: number;
  currency: 'CNY' | 'USDT';
  cycle_days: number;
  rate: number;
  estimated_profit: number;
  earned_amount: number;
  status: 'running' | 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  created_at: string;
}

// ============================================
// 财务相关类型
// ============================================

interface RechargeRecord {
  id: number;
  order_no: string;
  user_id: number;
  amount: number;
  currency: 'CNY' | 'USDT';
  payment_method: string;
  voucher?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
}

interface WithdrawRecord {
  id: number;
  order_no: string;
  user_id: number;
  amount: number;
  currency: 'CNY' | 'USDT';
  bank_info?: string;
  usdt_address?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
}

// ============================================
// VIP 相关类型
// ============================================

interface VIPLevel {
  level: number;
  name: string;
  min_invest: number;
  interest_rate: number;
  commission_l1: number;
  commission_l2: number;
  commission_l3: number;
  benefits: string[];
}

interface VIPProgress {
  current_level: number;
  current_invest: number;
  next_level: number;
  next_level_require: number;
  progress: number;
}

// ============================================
// 团队相关类型
// ============================================

interface TeamMember {
  id: number;
  uid: string;
  username: string;
  level: number;
  total_invest: number;
  team_count: number;
  created_at: string;
}

interface TeamReward {
  id: number;
  from_user_id: number;
  from_username: string;
  amount: number;
  currency: 'CNY' | 'USDT';
  type: 'commission_l1' | 'commission_l2' | 'commission_l3';
  created_at: string;
}

// ============================================
// 全局函数类型
// ============================================

declare function showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info'): void;
declare function formatMoney(amount: number): string;
declare function formatDate(date: string | Date): string;

// ============================================
// 全局变量
// ============================================

declare const API_CONFIG: APIConfig;
declare let userData: UserData;

// ============================================
// Telegram WebApp 类型
// ============================================

interface TelegramWebApp {
  ready(): void;
  close(): void;
  expand(): void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    setText(text: string): void;
    onClick(callback: () => void): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
  };
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };
}

declare const Telegram: {
  WebApp: TelegramWebApp;
};
