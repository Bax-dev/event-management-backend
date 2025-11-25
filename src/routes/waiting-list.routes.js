const { Router } = require('express');
const { WaitingListController } = require('../controllers/waiting-list.controller');
const { RateLimitUtil } = require('../utils/rate-limit.util');

const router = Router();
const waitingListController = new WaitingListController();

const writeLimiter = RateLimitUtil.createWriteLimiter();

const readLimiter = RateLimitUtil.createReadLimiter();

router.post('/', writeLimiter, waitingListController.addToWaitingList);
router.get('/event/:eventId', readLimiter, waitingListController.getWaitingListByEventId);
router.get('/:id', readLimiter, waitingListController.getWaitingListById);
router.delete('/:id', writeLimiter, waitingListController.cancelWaitingListEntry);
router.post('/process/:eventId', writeLimiter, waitingListController.processWaitingList);

module.exports = router;
