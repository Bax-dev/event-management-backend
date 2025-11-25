const { Router } = require('express');
const { EventController } = require('../controllers/event.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const eventController = new EventController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

router.post('/', writeLimiter, eventController.createEvent);
router.get('/', readLimiter, eventController.getAllEvents);
router.get('/:id/tickets', readLimiter, eventController.getAvailableTickets);
router.get('/:id', readLimiter, eventController.getEventById);
router.put('/:id', writeLimiter, eventController.updateEvent);
router.delete('/:id', writeLimiter, eventController.deleteEvent);

module.exports = router;
