/**
 * Authentication Service
 * 
 * Business logic for signup, login, token refresh, and logout.
 * Uses JWT access + refresh token pattern for secure auth.
 * 
 * Flow:
 *   Login → accessToken (15m) + refreshToken (7d)
 *   Access expires → POST /auth/refresh with refreshToken → new pair
 *   Refresh tokens are rotated on each use (one-time use)
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');
const userRepository = require('../repositories/userRepository');
const ValidationError = require('../errors/ValidationError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

const authService = {
  /**
   * Register a new user.
   * @param {{ name: string, email: string, password: string }} data
   * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
   */
  async signup({ name, email, password }) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token pair
    const tokens = await this._generateAndStoreTokens(user._id);

    logger.info(`New user registered: ${email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription || { plan: 'free', status: 'none' },
      },
      ...tokens,
    };
  },

  /**
   * Authenticate user with email and password.
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
   */
  async login({ email, password }) {
    // Find user with password field included
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token pair
    const tokens = await this._generateAndStoreTokens(user._id);

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription || { plan: 'free', status: 'none' },
      },
      ...tokens,
    };
  },

  /**
   * Refresh access token using a valid refresh token.
   * Implements token rotation — old refresh token is invalidated.
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string, refreshToken: string }>}
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    // Verify the refresh token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find user and check stored refresh token
    const user = await userRepository.findByIdWithRefreshToken(decoded.id);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedError('Invalid refresh token — please login again');
    }

    // Compare stored hash with provided token
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      // Possible token theft — clear all refresh tokens for safety
      await userRepository.updateRefreshToken(user._id, null);
      logger.warn(`Possible refresh token theft detected for user: ${user._id}`);
      throw new UnauthorizedError('Refresh token reuse detected — please login again');
    }

    // Rotate: generate new token pair
    const tokens = await this._generateAndStoreTokens(user._id);

    logger.info(`Token refreshed for user: ${user._id}`);

    return tokens;
  },

  /**
   * Logout — invalidate refresh token.
   * @param {string} userId
   */
  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
    logger.info(`User logged out: ${userId}`);
  },

  /**
   * Get user profile by ID.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      subscription: user.subscription || { plan: 'free', status: 'none' },
    };
  },

  // ─── Private Helpers ─────────────────────────────────────────

  /**
   * Generate access + refresh token pair and store hashed refresh token.
   * @param {string} userId
   * @returns {Promise<{ accessToken: string, refreshToken: string }>}
   * @private
   */
  async _generateAndStoreTokens(userId) {
    const accessToken = jwt.sign(
      { id: userId },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    // Store hashed refresh token in DB (never store raw tokens)
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await userRepository.updateRefreshToken(userId, hashedRefresh);

    return { accessToken, refreshToken };
  },
};

module.exports = authService;
