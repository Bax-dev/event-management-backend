const { Response } = require('express');

class ResponseUtil {
  static success(res, data, message, statusCode = 200) {
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (message) {
      response.message = message;
    }

    if (data !== undefined) {
      response.data = data;
    }

    res.status(statusCode).json(response);
  }

  static created(res, data, message = 'Resource created successfully') {
    ResponseUtil.success(res, data, message, 201);
  }

  static error(res, message, statusCode = 500, error) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      response.error = error;
    }

    res.status(statusCode).json(response);
  }

  static validationError(res, errors, message = 'Validation failed') {
    const response = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };

    res.status(400).json(response);
  }

  static notFound(res, message = 'Resource not found') {
    ResponseUtil.error(res, message, 404);
  }

  static internalServerError(res, error, message = 'Internal server error') {
    const errorMessage =
      error instanceof Error ? error.message : error || 'Unknown error';
    ResponseUtil.error(res, message, 500, errorMessage);
  }

  static badRequest(res, message = 'Bad request', errors) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    res.status(400).json(response);
  }

  static withCount(res, data, message, statusCode = 200) {
    const response = {
      success: true,
      count: data.length,
      data,
      timestamp: new Date().toISOString(),
    };

    if (message) {
      response.message = message;
    }

    res.status(statusCode).json(response);
  }
}

module.exports = { ResponseUtil };
