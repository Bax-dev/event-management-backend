const express = require('express');
const { LoggerUtil } = require('../utils/logger.util');
const { ResponseUtil } = require('../utils/response.util');

class JsonParserMiddleware {
  static DEFAULT_LIMIT = '10mb';

  static create(config = {}) {
    const limit = config.limit || JsonParserMiddleware.DEFAULT_LIMIT;
    const strict = config.strict !== false;

    const jsonParser = express.json({
      limit,
      strict,
      type: config.type || [
        'application/json',
        'application/json-patch+json',
        'application/vnd.api+json',
      ],
      verify: (req, _res, buf) => {
        if (buf.length > 1024 * 1024) {
          LoggerUtil.info('Large JSON payload received', {
            size: `${(buf.length / 1024 / 1024).toFixed(2)}MB`,
            path: req.path,
            method: req.method,
          });
        }
      },
    });

    return (req, res, next) => {
      if (req.method === 'GET' || req.method === 'HEAD') {
        return next();
      }

      if (strict && req.headers['content-type']) {
        const contentType = req.headers['content-type'];
        const allowedTypes = Array.isArray(config.type)
          ? config.type
          : [config.type || 'application/json'];

        const isAllowed = allowedTypes.some((type) =>
          contentType.includes(type)
        );

        if (!isAllowed) {
          LoggerUtil.warn('Invalid Content-Type for JSON request', {
            contentType,
            path: req.path,
            method: req.method,
          });
          ResponseUtil.error(res, 'Content-Type must be application/json', 415);
          return;
        }
      }

      jsonParser(req, res, (error) => {
        if (error) {
          if (error instanceof SyntaxError) {
            LoggerUtil.warn('Invalid JSON in request body', {
              error: error.message,
              path: req.path,
              method: req.method,
            });
            ResponseUtil.error(res, 'Invalid JSON format in request body', 400);
            return;
          }

          if (
            error instanceof Error &&
            (error.message.includes('too large') ||
              error.message.includes('limit'))
          ) {
            LoggerUtil.warn('Request body too large', {
              error: error.message,
              path: req.path,
              method: req.method,
            });
            ResponseUtil.error(
              res,
              `Request entity too large. Maximum size: ${limit}`,
              413
            );
            return;
          }

          LoggerUtil.error('Error parsing JSON request', error);
          ResponseUtil.error(res, 'Error processing request', 400);
          return;
        }

        next();
      });
    };
  }
}

module.exports = { JsonParserMiddleware };
