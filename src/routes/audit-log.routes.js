const express = require('express');
const { AuditLogController } = require('../controllers/audit-log.controller');
const { AuthMiddleware } = require('../middleware/auth.middleware');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = express.Router();
const controller = new AuditLogController();

// Apply rate limiting - 100 requests per 15 minutes
const readLimiter = RateLimitUtil.createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many audit log requests, please try again later.',
});
router.use(readLimiter);

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Get current user's audit logs
router.get('/me', (req, res) => controller.getMyLogs(req, res));

// Get audit log by ID
router.get('/:id', (req, res) => controller.getById(req, res));

// Get audit logs by user ID
router.get('/user/:userId', (req, res) => controller.getByUserId(req, res));

// Get audit logs by entity
router.get('/entity/:entityType/:entityId', (req, res) => controller.getByEntity(req, res));

// Get audit logs by action
router.get('/action/:action', (req, res) => controller.getByAction(req, res));

// Get all audit logs (with pagination)
router.get('/', (req, res) => controller.getAll(req, res));

module.exports = router;

