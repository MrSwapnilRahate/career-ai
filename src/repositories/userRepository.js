/**
 * User Repository
 * 
 * All database operations for the User model.
 * Controllers and services NEVER touch User model directly.
 */

const User = require('../models/User');

const userRepository = {
  /**
   * Find user by email (includes password for auth).
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return User.findOne({ email }).select('+password');
  },

  /**
   * Find user by ID (excludes password).
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return User.findById(id);
  },

  /**
   * Find user by ID with refresh token (for token rotation).
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findByIdWithRefreshToken(id) {
    return User.findById(id).select('+refreshToken');
  },

  /**
   * Create a new user.
   * @param {{ name: string, email: string, password: string }} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return User.create(data);
  },

  /**
   * Update the stored refresh token for a user.
   * @param {string} userId
   * @param {string|null} hashedToken - Hashed refresh token, or null to clear
   * @returns {Promise<Object>}
   */
  async updateRefreshToken(userId, hashedToken) {
    return User.findByIdAndUpdate(
      userId,
      { refreshToken: hashedToken },
      { new: true }
    );
  },
};

module.exports = userRepository;
