const { JwtUtil } = require('../utils/jwt.util');
const { ResponseUtil } = require('../utils/response.util');
const { UnauthorizedError } = require('../utils/custom-errors.util');

class AuthMiddleware {
  static authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);

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

  static optional(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = JwtUtil.verifyToken(token);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
        };
      }

      next();
    } catch (error) {
      next();
    }
  }
}

module.exports = { AuthMiddleware };

