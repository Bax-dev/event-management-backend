const express = require('express');
const { AuditLogController } = require('../controllers/audit-log.controller');
const { AuthMiddleware } = require('../middleware/auth.middleware');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = express.Router();
const controller = new AuditLogController();

const readLimiter = RateLimitUtil.createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many audit log requests, please try again later.',
});
router.use(readLimiter);

router.use(AuthMiddleware.authenticate);

router.get('/me', (req, res) => controller.getMyLogs(req, res));

router.get('/:id', (req, res) => controller.getById(req, res));

router.get('/user/:userId', (req, res) => controller.getByUserId(req, res));

router.get('/entity/:entityType/:entityId', (req, res) => controller.getByEntity(req, res));

router.get('/action/:action', (req, res) => controller.getByAction(req, res));

router.get('/', (req, res) => controller.getAll(req, res));

module.exports = router;

