const LOG_LEVELS = ['error', 'warn', 'info', 'debug']

const rawLogLevel = (process.env.LOG_LEVEL || 'info').toLowerCase()
const CURRENT_LOG_LEVEL = LOG_LEVELS.includes(rawLogLevel) ? rawLogLevel : 'info'

function shouldLog(level) {
  return LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf(CURRENT_LOG_LEVEL)
}

function formatMessage(level, args) {
  const now = new Date()
  const date = now.toLocaleDateString('en-CA') // ISO-style date
  const time = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const colorCodes = {
    error: '\x1b[31m', // Red
    warn: '\x1b[33m',  // Yellow
    info: '\x1b[36m',  // Cyan
    debug: '\x1b[90m', // Gray
  }

  const resetCode = '\x1b[0m'
  const levelTag = `${colorCodes[level]}[${level.toUpperCase().padEnd(5)}]${resetCode}`
  const timestamp = `[${date} ${time}]`

  return [`${levelTag} ${timestamp}`, ...args]
}

export const logger = Object.fromEntries(
  LOG_LEVELS.map((level) => [
    level,
    (...args) => {
      if (shouldLog(level)) {
        console[level](...formatMessage(level, args))
      }
    },
  ])
)

