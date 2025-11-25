const express = require('express');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const { db, LoggerUtil, RateLimitUtil } = require('./utils');
const { JsonParserMiddleware } = require('./middleware');
const { swaggerSpec } = require('./config/swagger.config');
const eventRoutes = require('./routes/event.routes');
const waitingListRoutes = require('./routes/waiting-list.routes');
const bookingRoutes = require('./routes/booking.routes');
const orderRoutes = require('./routes/order.routes');
const ticketRoutes = require('./routes/ticket.routes');
const authRoutes = require('./routes/auth.routes');
const auditLogRoutes = require('./routes/audit-log.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting - Apply general rate limit to all requests
app.use(RateLimitUtil.createGeneralLimiter());

// JSON parsing middleware with proper error handling
app.use(
  JsonParserMiddleware.create({
    limit: process.env.JSON_BODY_LIMIT || '10mb',
    strict: true,
  })
);

// URL-encoded body parser
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URL_ENCODED_LIMIT || '10mb',
  })
);

// Initialize database connection
db.connect();

// Run database migrations
const runMigrations = async () => {
  try {
    const { MigrationRunner } = require('../migrate');
    const runner = new MigrationRunner();
    await runner.runMigrations();
    LoggerUtil.info('Database migrations completed successfully');
  } catch (error) {
    LoggerUtil.error('Error running migrations', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Simplified ticket management endpoints
app.use('/api', ticketRoutes);

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Event Management API Documentation',
}));

// ReDoc Documentation
app.get('/docs', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Event Management API - ReDoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <redoc 
          spec-url='/api-docs/swagger.json'
          hide-download-button="false"
          hide-hostname="false"
          expand-responses="200,201"
          path-in-middle-panel="true"
        ></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `);
});

// Swagger JSON endpoint
app.get('/api-docs/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  // Ensure clean JSON output
  const jsonString = JSON.stringify(swaggerSpec, null, 2);
  res.send(jsonString);
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbConnected = await db.testConnection();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'error',
    message: dbConnected ? 'Server is running' : 'Database connection failed',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const startServer = async () => {
  try {
    await runMigrations();
    
    const server = app.listen(PORT, () => {
      LoggerUtil.info(`Server is running on port ${PORT}`);
      LoggerUtil.info(`Health check: http://localhost:${PORT}/health`);
      LoggerUtil.info(`Swagger UI: http://localhost:${PORT}/api-docs`);
      LoggerUtil.info(`ReDoc: http://localhost:${PORT}/docs`);
      LoggerUtil.info(`Events API: http://localhost:${PORT}/api/events`);
      LoggerUtil.info(`Ticket API: http://localhost:${PORT}/api/initialize`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        LoggerUtil.error(
          `Port ${PORT} is already in use. Please either:`,
          new Error(
            `1. Stop the process using port ${PORT}\n` +
            `2. Set a different port using PORT environment variable\n` +
            `3. On Windows, find and kill the process: netstat -ano | findstr :${PORT}`
          )
        );
        process.exit(1);
      } else {
        LoggerUtil.error('Server error', error);
        process.exit(1);
      }
    });
  } catch (error) {
    LoggerUtil.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  LoggerUtil.info('SIGTERM signal received: closing HTTP server');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  LoggerUtil.info('SIGINT signal received: closing HTTP server');
  await db.close();
  process.exit(0);
});

startServer();

module.exports = app;
