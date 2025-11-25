const { JsonParserMiddleware } = require('./json-parser.middleware');
const { AuthMiddleware } = require('./auth.middleware');

module.exports = {
  JsonParserMiddleware,
  AuthMiddleware,
};
