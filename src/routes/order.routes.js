const { Router } = require('express');
const { OrderController } = require('../controllers/order.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const orderController = new OrderController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

router.post('/', writeLimiter, orderController.createOrder);
router.get('/user/:userId', readLimiter, orderController.getOrdersByUserId);
router.get('/:id', readLimiter, orderController.getOrderById);
router.put('/:id', writeLimiter, orderController.updateOrder);

module.exports = router;
