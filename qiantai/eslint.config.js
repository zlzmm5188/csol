// ESLint 9.x 配置文件
export default [
  {
    ignores: [
      'node_modules/**',
      'backup/**',
      'backups/**',
      'lib/**',
      '启动图/**',
      '备份_原始文件/**',
      'js-final-fix-backup-*/**',
      'tools/api-generator.js',  // Has complex template literals with markdown
      '*.min.js',
      '*.bak',
      '*.backup',
      '*.broken',
      '*.broken.*',
      '*.old.*',
      '*.temp',
      '*.zip',
      '*.tar.gz'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
        CustomEvent: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        Event: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        AbortController: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURIComponent: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        Symbol: 'readonly',
        Proxy: 'readonly',
        Reflect: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',

        // Project-specific globals (defined in other files)
        API_CONFIG: 'readonly',
        API_MAP: 'readonly',
        ApiClient: 'readonly',
        ApiService: 'readonly',
        TokenManager: 'readonly',
        TokenService: 'readonly',
        httpClient: 'readonly',
        AIService: 'readonly',
        AI_CONFIG: 'readonly',
        AI_OPENAI: 'readonly',
        AI_RULES_ENGINE: 'readonly',
        AI_SERVICE_LOCAL: 'readonly',
        AIChatAPI: 'readonly',
        showToast: 'readonly',
        matchKnowledge: 'readonly',

        // Node.js globals (for tools)
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',

        // Additional browser globals
        screen: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        performance: 'readonly',
        history: 'readonly',
        WebSocket: 'readonly',
        AudioContext: 'readonly',
        Notification: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        FileReader: 'readonly',
        getComputedStyle: 'readonly',
        CSS: 'readonly',
        AbortSignal: 'readonly',

        // External libraries (loaded via script tags)
        Tesseract: 'readonly',
        CryptoJS: 'readonly',
        TelegramAPI: 'readonly',

        // DOM globals
        Node: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        Document: 'readonly',
        Window: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',

        // Application-specific globals
        userData: 'writable',
        API: 'readonly',
        http: 'readonly',
        loadUserData: 'readonly',
        containerId: 'readonly',
        showConfirm: 'readonly',
        LoginHandler: 'readonly',
        event: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'no-undef': 'error',
      'no-redeclare': 'error',
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { 'avoidEscape': true }],
      'indent': ['warn', 2, { 'SwitchCase': 1 }],
      'comma-dangle': ['warn', 'never'],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always']
    }
  }

];
