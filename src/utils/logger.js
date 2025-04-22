import dotenv from 'dotenv'
dotenv.config()

const LOG_LEVELS = ['error', 'warn', 'info', 'debug']
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'info'


function shouldLog(level) {
  return LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(CURRENT_LOG_LEVEL)
}

export const logger = {
  error: (...args) => shouldLog('error') && console.error('[ERROR]', ...args),
  warn: (...args) => shouldLog('warn') && console.warn('[WARN]', ...args),
  info: (...args) => shouldLog('info') && console.info('[INFO]', ...args),
  debug: (...args) => shouldLog('debug') && console.debug('[DEBUG]', ...args),
};