/**
 * @swagger
 * tags:
 *   - name: Tickets
 *     description: Simplified ticket management endpoints
 */

const { Router } = require('express');
const { TicketController } = require('../controllers/ticket.controller');
const { AuthMiddleware } = require('../middleware/auth.middleware');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const ticketController = new TicketController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

/**
 * @swagger
 * /api/initialize:
 *   post:
 *     summary: Initialize a new event with a given number of tickets
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - totalTickets
 *             properties:
 *               name:
 *                 type: string
 *                 example: Summer Music Festival 2024
 *               description:
 *                 type: string
 *                 example: Annual summer music festival featuring top artists
 *               totalTickets:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000000
 *                 example: 100
 *     responses:
 *       201:
 *         description: Event initialized successfully
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
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     totalTickets:
 *                       type: integer
 *                     availableTickets:
 *                       type: integer
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/initialize', writeLimiter, ticketController.initializeEvent);

/**
 * @swagger
 * /api/book:
 *   post:
 *     summary: Book tickets for a user (automatically adds to waiting list if sold out)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - numberOfTickets
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               numberOfTickets:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 5
 *     responses:
 *       201:
 *         description: Tickets booked successfully or added to waiting list
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Successful booking
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         bookingId:
 *                           type: string
 *                           format: uuid
 *                         eventId:
 *                           type: string
 *                           format: uuid
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                         numberOfTickets:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [confirmed]
 *                         message:
 *                           type: string
 *                           example: Tickets booked successfully
 *                 - type: object
 *                   description: Added to waiting list
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         waitingListId:
 *                           type: string
 *                           format: uuid
 *                         eventId:
 *                           type: string
 *                           format: uuid
 *                         userId:
 *                           type: string
 *                           format: uuid
 *                         numberOfTickets:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [pending]
 *                         position:
 *                           type: integer
 *                         message:
 *                           type: string
 *                           example: Event is sold out. You have been added to the waiting list.
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/responses/Error'
 *       400:
 *         description: Validation error
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Conflict (not enough tickets available)
 *         $ref: '#/components/responses/Error'
 */
router.post('/book', writeLimiter, AuthMiddleware.authenticate, ticketController.bookTicket);

/**
 * @swagger
 * /api/cancel:
 *   post:
 *     summary: Cancel a booking for a user (automatically assigns to waiting list if available)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 example: 660e8400-e29b-41d4-a716-446655440001
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
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
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                       format: uuid
 *                     eventId:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [cancelled]
 *                     message:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *         $ref: '#/components/responses/Error'
 *       403:
 *         description: Forbidden (can only cancel own bookings)
 *         $ref: '#/components/responses/Error'
 *       404:
 *         description: Booking not found
 *         $ref: '#/components/responses/Error'
 *       400:
 *         description: Validation error
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/cancel', writeLimiter, AuthMiddleware.authenticate, ticketController.cancelBooking);

/**
 * @swagger
 * /api/status/{eventId}:
 *   get:
 *     summary: Get current status of an event (available tickets, waiting list count)
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Event status retrieved successfully
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
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       format: uuid
 *                     eventName:
 *                       type: string
 *                     totalTickets:
 *                       type: integer
 *                     bookedTickets:
 *                       type: integer
 *                     availableTickets:
 *                       type: integer
 *                     isSoldOut:
 *                       type: boolean
 *                     waitingListCount:
 *                       type: integer
 *                     waitingListEntries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           numberOfTickets:
 *                             type: integer
 *                           position:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/status/:eventId', readLimiter, ticketController.getEventStatus);

module.exports = router;
