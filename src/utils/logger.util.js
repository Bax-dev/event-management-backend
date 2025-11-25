const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class LoggerUtil {
  static formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(LoggerUtil.formatMessage(LogLevel.DEBUG, message), ...args);
    }
  }

  static info(message, ...args) {
    console.info(LoggerUtil.formatMessage(LogLevel.INFO, message), ...args);
  }

  static warn(message, ...args) {
    console.warn(LoggerUtil.formatMessage(LogLevel.WARN, message), ...args);
  }

  static error(message, error, ...args) {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
    console.error(
      LoggerUtil.formatMessage(LogLevel.ERROR, message),
      errorDetails,
      ...args
    );
  }

  static logQuery(query, duration, rowCount) {
    LoggerUtil.debug('Query executed', {
      query,
      duration,
      rowCount,
    });
  }
}

module.exports = { LoggerUtil };
