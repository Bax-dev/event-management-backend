/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: Booking management endpoints
 */

const { Router } = require('express');
const { BookingController } = require('../controllers/booking.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const bookingController = new BookingController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - userId
 *               - numberOfTickets
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               userId:
 *                 type: string
 *                 format: uuid
 *               numberOfTickets:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *             examples:
 *               single:
 *                 summary: Book a single ticket
 *                 value:
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   numberOfTickets: 1
 *               multiple:
 *                 summary: Book multiple tickets
 *                 value:
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   numberOfTickets: 5
 *               family:
 *                 summary: Book tickets for family
 *                 value:
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   numberOfTickets: 10
 *     responses:
 *       201:
 *         description: Booking created successfully
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
router.post('/', writeLimiter, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/event/{eventId}:
 *   get:
 *     summary: Get all bookings for an event
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/event/:eventId', readLimiter, bookingController.getBookingsByEventId);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', readLimiter, bookingController.getBookingById);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id', writeLimiter, bookingController.cancelBooking);

module.exports = router;
