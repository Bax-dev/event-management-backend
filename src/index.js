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

app.use('/api/tickets', ticketRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Event Management API Documentation',
  swaggerOptions: {
    docExpansion: 'none', 
    defaultModelsExpandDepth: 0, 
    defaultModelExpandDepth: 0,
    filter: true, 
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

app.get('/api-docs/swagger.json', (_req, res) => {
  try {

    const jsonString = JSON.stringify(swaggerSpec);
    
    const validated = JSON.parse(jsonString);
    
    if (!validated.openapi && !validated.swagger) {
      throw new Error('Invalid OpenAPI specification');
    }
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.json(validated);
  } catch (error) {
    LoggerUtil.error('Error generating swagger.json', error);
    res.status(500).json({ 
      error: 'Failed to generate API documentation', 
      message: error.message 
    });
  }
});

app.get('/health', async (_req, res) => {
  const dbConnected = await db.testConnection();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'error',
    message: dbConnected ? 'Server is running' : 'Database connection failed',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await db.ensureDatabase();
    db.connect();
    await runMigrations();
    
    const server = app.listen(PORT, () => {
      LoggerUtil.info(`Server is running on port ${PORT}`);
      LoggerUtil.info(`Health check: http://localhost:${PORT}/health`);
      LoggerUtil.info(`Swagger UI: http://localhost:${PORT}/api-docs`);
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
