/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management endpoints
 */

const { Router } = require('express');
const { OrderController } = require('../controllers/order.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const orderController = new OrderController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - eventId
 *               - bookingId
 *               - totalAmount
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               totalAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 1000000
 *               currency:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 3
 *                 default: NGN
 *               paymentMethod:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerPhone:
 *                 type: string
 *               billingAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *             examples:
 *               basic:
 *                 summary: Basic order
 *                 value:
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   bookingId: 770e8400-e29b-41d4-a716-446655440002
 *                   totalAmount: 5000
 *               full:
 *                 summary: Full order with customer details
 *                 value:
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   bookingId: 770e8400-e29b-41d4-a716-446655440002
 *                   totalAmount: 15000
 *                   currency: "NGN"
 *                   paymentMethod: "card"
 *                   customerName: "John Doe"
 *                   customerEmail: "john.doe@example.com"
 *                   customerPhone: "+1234567890"
 *                   billingAddress: "123 Main St, City, Country"
 *                   notes: "Please deliver to front door"
 *               usd:
 *                 summary: Order in USD
 *                 value:
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   bookingId: 770e8400-e29b-41d4-a716-446655440002
 *                   totalAmount: 50
 *                   currency: "USD"
 *                   paymentMethod: "paypal"
 *                   customerEmail: "customer@example.com"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', writeLimiter, orderController.createOrder);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Get all orders for a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       404:
 *         description: User not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/user/:userId', readLimiter, orderController.getOrdersByUserId);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', readLimiter, orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, paid, cancelled, refunded]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, processing, completed, failed, refunded]
 *               paymentMethod:
 *                 type: string
 *               paymentTransactionId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerPhone:
 *                 type: string
 *               billingAddress:
 *                 type: string
 *               notes:
 *                 type: string
 *             examples:
 *               status:
 *                 summary: Update order status
 *                 value:
 *                   status: "paid"
 *               payment:
 *                 summary: Update payment status
 *                 value:
 *                   paymentStatus: "completed"
 *                   paymentTransactionId: "txn_1234567890"
 *               customer:
 *                 summary: Update customer details
 *                 value:
 *                   customerName: "Jane Doe"
 *                   customerEmail: "jane.doe@example.com"
 *                   customerPhone: "+9876543210"
 *               full:
 *                 summary: Update multiple fields
 *                 value:
 *                   status: "paid"
 *                   paymentStatus: "completed"
 *                   paymentMethod: "card"
 *                   paymentTransactionId: "txn_1234567890"
 *                   customerName: "Jane Doe"
 *                   customerEmail: "jane.doe@example.com"
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Validation error
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Order not found
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id', writeLimiter, orderController.updateOrder);

module.exports = router;
