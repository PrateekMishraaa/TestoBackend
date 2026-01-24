// 简单的日志工具
const logger = {
  info: (message, data = null) => {
    console.log(`ℹ️  [INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message, error = null) => {
    console.error(`❌ [ERROR] ${message}`, error ? error.message : '');
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  },
  
  warn: (message, data = null) => {
    console.warn(`⚠️  [WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🐛 [DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

export default logger;