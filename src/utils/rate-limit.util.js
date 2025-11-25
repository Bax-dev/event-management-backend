const rateLimit = require('express-rate-limit');
const { ResponseUtil } = require('./response.util');
const { LoggerUtil } = require('./logger.util');

class RateLimitUtil {
  static createLimiter(config) {
    const options = {
      windowMs: config.windowMs,
      max: config.max,
      standardHeaders: config.standardHeaders ?? true,
      legacyHeaders: config.legacyHeaders ?? false,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
      skipFailedRequests: config.skipFailedRequests ?? false,
      handler: (req, res) => {
        LoggerUtil.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
        });

        ResponseUtil.error(
          res,
          config.message || 'Too many requests, please try again later.',
          429
        );
      },
    };

    return rateLimit(options);
  }

  static createGeneralLimiter() {
    const windowMs = parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10
    );
    const max = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

    return RateLimitUtil.createLimiter({
      windowMs,
      max,
      message: 'Too many requests, please try again later.',
    });
  }

  static createStrictLimiter() {
    const windowMs = parseInt(
      process.env.RATE_LIMIT_STRICT_WINDOW_MS || '60000',
      10
    );
    const max = parseInt(process.env.RATE_LIMIT_STRICT_MAX || '10', 10);

    return RateLimitUtil.createLimiter({
      windowMs,
      max,
      message: 'Too many requests, please slow down.',
    });
  }

  static createAuthLimiter() {
    const windowMs = parseInt(
      process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000',
      10
    );
    const max = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10);

    return RateLimitUtil.createLimiter({
      windowMs,
      max,
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true,
    });
  }

  static createWriteLimiter() {
    const windowMs = parseInt(
      process.env.RATE_LIMIT_WRITE_WINDOW_MS || '60000',
      10
    );
    const max = parseInt(process.env.RATE_LIMIT_WRITE_MAX || '20', 10);

    return RateLimitUtil.createLimiter({
      windowMs,
      max,
      message: 'Too many write requests, please try again later.',
    });
  }

  static createReadLimiter() {
    const windowMs = parseInt(
      process.env.RATE_LIMIT_READ_WINDOW_MS || '60000',
      10
    );
    const max = parseInt(process.env.RATE_LIMIT_READ_MAX || '100', 10);

    return RateLimitUtil.createLimiter({
      windowMs,
      max,
      message: 'Too many read requests, please try again later.',
    });
  }
}

module.exports = { RateLimitUtil };
