// Simple logger utility for Vite plugins
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(label, level = 'info') {
  return (...args) => {
    if (process.env.DEBUG || (level !== 'debug')) {
      const prefix = label ? `[${label}]` : '';
      const colorCode = {
        debug: colors.blue,
        info: colors.cyan,
        warn: colors.yellow,
        error: colors.red,
      }[level] || colors.reset;
      
      console.log(`${colorCode}${prefix}${colors.reset}`, ...args);
    }
  };
}

export function createLogger(name) {
  return {
    debug: log(name, 'debug'),
    info: log(name, 'info'),
    warn: log(name, 'warn'),
    error: log(name, 'error'),
  };
}

export const logger = {
  debug: log(null, 'debug'),
  info: log(null, 'info'),
  warn: log(null, 'warn'),
  error: log(null, 'error'),
};

export default createLogger;
