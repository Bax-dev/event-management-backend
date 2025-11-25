/**
 * @typedef {Object} UserEntity
 * @property {string} id
 * @property {string} email
 * @property {string} passwordHash
 * @property {string} [name]
 * @property {string} [phone]
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Date} [lastLogin]
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} email
 * @property {string} password
 * @property {string} [name]
 * @property {string} [phone]
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} UserResponse
 * @property {string} id
 * @property {string} email
 * @property {string} [name]
 * @property {string} [phone]
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [lastLogin]
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {UserResponse} user
 */

module.exports = {};

