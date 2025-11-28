const { JwtUtil } = require('../utils/jwt.util');
const { ResponseUtil } = require('../utils/response.util');
const { UnauthorizedError } = require('../utils/custom-errors.util');
const { tokenBlacklistUtil } = require('../utils/token-blacklist.util');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);

      const isBlacklisted = await tokenBlacklistUtil.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      const decoded = JwtUtil.verifyToken(token);

      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        ResponseUtil.error(res, error.message, 401);
        return;
      }
      ResponseUtil.error(res, 'Invalid or expired token', 401);
    }
  }

  static async optional(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const isBlacklisted = await tokenBlacklistUtil.isTokenBlacklisted(token);
        if (!isBlacklisted) {
          const decoded = JwtUtil.verifyToken(token);
          req.user = {
            id: decoded.userId,
            email: decoded.email,
          };
        }
      }

      next();
    } catch (error) {
      next();
    }
  }
}

module.exports = { AuthMiddleware };

