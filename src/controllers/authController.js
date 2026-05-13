/**
 * Auth Controller (Thin Layer)
 * 
 * Only handles HTTP request/response.
 * All business logic is delegated to authService.
 * All errors are forwarded to the centralized error middleware via next().
 */

const authService = require('../services/authService');

/**
 * POST /api/auth/signup
 * Register a new user account.
 */
exports.signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return token pair.
 */
exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new token pair.
 */
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Invalidate refresh token (requires authentication).
 */
exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/profile
 * Get authenticated user's profile.
 */
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
