const { EventRepository } = require('./event.repository');
const { WaitingListRepository } = require('./waiting-list.repository');
const { BookingRepository } = require('./booking.repository');
const { OrderRepository } = require('./order.repository');
const { UserRepository } = require('./user.repository');

module.exports = {
  EventRepository,
  WaitingListRepository,
  BookingRepository,
  OrderRepository,
  UserRepository,
};
