const express = require('express');
const { db } = require('../../../src/utils/database.connection');
const { JsonParserMiddleware } = require('../../../src/middleware');
const { RateLimitUtil } = require('../../../src/utils/rate-limit.util');
const eventRoutes = require('../../../src/routes/event.routes');
const waitingListRoutes = require('../../../src/routes/waiting-list.routes');
const bookingRoutes = require('../../../src/routes/booking.routes');
const orderRoutes = require('../../../src/routes/order.routes');
const ticketRoutes = require('../../../src/routes/ticket.routes');
const authRoutes = require('../../../src/routes/auth.routes');
const auditLogRoutes = require('../../../src/routes/audit-log.routes');

/**
 * Creates a test Express app instance for integration testing
 * This app is configured similarly to the main app but without
 * database migrations and server startup
 */
function createTestApp() {
  const app = express();

  // Rate limiting - Apply general rate limit to all requests
  app.use(RateLimitUtil.createGeneralLimiter());

  // JSON parsing middleware with proper error handling
  app.use(
    JsonParserMiddleware.create({
      limit: '10mb',
      strict: true,
    })
  );

  // URL-encoded body parser
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    })
  );

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/waiting-list', waitingListRoutes);
  app.use('/api/audit-logs', auditLogRoutes);

  // Ticket management endpoints
  app.use('/api/tickets', ticketRoutes);

  // Health check endpoint
  app.get('/health', async (_req, res) => {
    const dbConnected = await db.testConnection();
    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? 'ok' : 'error',
      message: dbConnected ? 'Server is running' : 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

module.exports = { createTestApp };

