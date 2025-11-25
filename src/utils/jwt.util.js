const jwt = require('jsonwebtoken');

class JwtUtil {
  static generateToken(payload, expiresIn = '7d') {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    return jwt.sign(payload, secret, { expiresIn });
  }

  static verifyToken(token) {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = { JwtUtil };

