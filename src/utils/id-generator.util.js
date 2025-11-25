const { v4: uuidv4 } = require('uuid');

class IdGeneratorUtil {
  static generateEventId() {
    return uuidv4();
  }

  static generateId() {
    return uuidv4();
  }

  static generateUUID() {
    return uuidv4();
  }

  static generateShortId() {
    return uuidv4().replace(/-/g, '').substring(0, 16);
  }
}

module.exports = { IdGeneratorUtil };
