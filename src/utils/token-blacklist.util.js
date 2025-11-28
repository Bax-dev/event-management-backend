const { TokenBlacklistRepository } = require('../repositories/token-blacklist.repository');
const { JwtUtil } = require('./jwt.util');
const { LoggerUtil } = require('./logger.util');

class TokenBlacklistUtil {
  constructor() {
    this.repository = new TokenBlacklistRepository();
  }

  async blacklistToken(token) {
    const decoded = JwtUtil.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    const expiresAt = new Date(decoded.exp * 1000);
    const userId = decoded.userId;

    return await this.repository.addToken(token, userId, expiresAt);
  }

  async isTokenBlacklisted(token) {
    return await this.repository.isTokenBlacklisted(token);
  }

  async cleanupExpiredTokens() {
    try {
      const deletedCount = await this.repository.deleteExpiredTokens();
      if (deletedCount > 0) {
        LoggerUtil.debug(`Cleaned up ${deletedCount} expired blacklisted tokens`);
      }
      return deletedCount;
    } catch (error) {
      LoggerUtil.error('Error cleaning up expired tokens', error);
      return 0;
    }
  }

  async revokeUserTokens(userId) {
    return await this.repository.deleteTokensByUserId(userId);
  }
}

const tokenBlacklistUtil = new TokenBlacklistUtil();

if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    await tokenBlacklistUtil.cleanupExpiredTokens();
  }, 60 * 60 * 1000);
}

module.exports = { TokenBlacklistUtil, tokenBlacklistUtil };

