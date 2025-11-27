/**
 * @swagger
 * tags:
 *   - name: Waiting List
 *     description: Waiting list management endpoints
 */

const { Router } = require('express');
const { WaitingListController } = require('../controllers/waiting-list.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const waitingListController = new WaitingListController();

const writeLimiter = RateLimitUtil.createWriteLimiter();

const readLimiter = RateLimitUtil.createReadLimiter();

/**
 * @swagger
 * /api/waiting-list:
 *   post:
 *     summary: Add user to waiting list
 *     tags: [Waiting List]
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
 *                 summary: Request a single ticket
 *                 value:
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   numberOfTickets: 1
 *               multiple:
 *                 summary: Request multiple tickets
 *                 value:
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   numberOfTickets: 5
 *               family:
 *                 summary: Request tickets for family
 *                 value:
 *                   eventId: 550e8400-e29b-41d4-a716-446655440000
 *                   userId: 660e8400-e29b-41d4-a716-446655440001
 *                   numberOfTickets: 10
 *     responses:
 *       201:
 *         description: Added to waiting list successfully
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
router.post('/', writeLimiter, waitingListController.addToWaitingList);

/**
 * @swagger
 * /api/waiting-list/event/{eventId}:
 *   get:
 *     summary: Get waiting list for an event
 *     tags: [Waiting List]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waiting list retrieved successfully
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/event/:eventId', readLimiter, waitingListController.getWaitingListByEventId);

/**
 * @swagger
 * /api/waiting-list/{id}:
 *   get:
 *     summary: Get waiting list entry by ID
 *     tags: [Waiting List]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waiting list entry retrieved successfully
 *       404:
 *         description: Waiting list entry not found
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', readLimiter, waitingListController.getWaitingListById);

/**
 * @swagger
 * /api/waiting-list/{id}:
 *   delete:
 *     summary: Cancel waiting list entry
 *     tags: [Waiting List]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waiting list entry cancelled successfully
 *       404:
 *         description: Waiting list entry not found
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id', writeLimiter, waitingListController.cancelWaitingListEntry);

/**
 * @swagger
 * /api/waiting-list/process/{eventId}:
 *   post:
 *     summary: Process waiting list for an event (assigns tickets when available)
 *     tags: [Waiting List]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Waiting list processed successfully
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
 *                     processed:
 *                       type: integer
 *                       example: 5
 *                     message:
 *                       type: string
 *       404:
 *         description: Event not found
 *         $ref: '#/components/responses/Error'
 */
router.post('/process/:eventId', writeLimiter, waitingListController.processWaitingList);

module.exports = router;
