/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Event management endpoints
 */

const { Router } = require('express');
const { EventController } = require('../controllers/event.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const eventController = new EventController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', readLimiter, eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}/tickets:
 *   get:
 *     summary: Get available tickets for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Available tickets retrieved successfully
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id/tickets', readLimiter, eventController.getAvailableTickets);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', readLimiter, eventController.getEventById);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
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
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               totalTickets:
 *                 type: integer
 *                 description: Number of tickets to add (positive) or remove (negative) from current total
 *                 example: 50
 *             examples:
 *               name:
 *                 summary: Update event name only
 *                 value:
 *                   name: Updated Event Name
 *               description:
 *                 summary: Update description only
 *                 value:
 *                   description: "Updated event description"
 *               addTickets:
 *                 summary: Add tickets to existing total (e.g., add 50 tickets)
 *                 value:
 *                   totalTickets: 50
 *               reduceTickets:
 *                 summary: Reduce tickets from existing total (e.g., remove 20 tickets)
 *                 value:
 *                   totalTickets: -20
 *               full:
 *                 summary: Update all fields
 *                 value:
 *                   name: "Updated Event Name"
 *                   description: "Updated event description"
 *                   totalTickets: 1000
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Validation error
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id', writeLimiter, eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id', writeLimiter, eventController.deleteEvent);

module.exports = router;
