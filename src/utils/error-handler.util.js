const { ResponseUtil } = require('./response.util');
const {
  AppError,
  NotFoundError,
  ConcurrencyError,
  ValidationError,
} = require('./custom-errors.util');

class ErrorHandlerUtil {
  static handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error('Async error:', error);
        ErrorHandlerUtil.handleError(error, req, res, next);
      });
    };
  }

  static handleError(error, req, res, next) {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof AppError) {
      if (error instanceof NotFoundError) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error instanceof ConcurrencyError) {
        ResponseUtil.error(res, error.message, 409);
        return;
      }

      if (error instanceof ValidationError) {
        // If errors array is empty but message exists, use message as error
        const errors = error.errors && error.errors.length > 0 
          ? error.errors 
          : [error.message];
        ResponseUtil.validationError(res, errors, error.message);
        return;
      }

      ResponseUtil.error(res, error.message, error.statusCode);
      return;
    }

    if (error instanceof Error) {
      const isDatabaseError =
        error.message.includes('duplicate key') ||
        error.message.includes('violates') ||
        error.message.includes('foreign key') ||
        error.message.includes('connection');

      if (isDatabaseError) {
        ResponseUtil.error(res, 'Database operation failed', 500, error.message);
        return;
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      path: req?.path,
      method: req?.method,
    });

    ResponseUtil.internalServerError(res, errorMessage);
  }

  static logError(error, context, additionalInfo = {}) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Error logged:', {
      context,
      message: errorMessage,
      stack: errorStack,
      ...additionalInfo,
    });
  }
}

module.exports = { ErrorHandlerUtil };
