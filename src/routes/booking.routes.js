const { Router } = require('express');
const { BookingController } = require('../controllers/booking.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const bookingController = new BookingController();

const writeLimiter = RateLimitUtil.createWriteLimiter();
const readLimiter = RateLimitUtil.createReadLimiter();

router.post('/', writeLimiter, bookingController.createBooking);
router.get('/event/:eventId', readLimiter, bookingController.getBookingsByEventId);
router.get('/:id', readLimiter, bookingController.getBookingById);
router.delete('/:id', writeLimiter, bookingController.cancelBooking);

module.exports = router;
