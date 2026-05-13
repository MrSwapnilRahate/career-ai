const mongoose = require('mongoose');

/**
 * User Model
 * 
 * Enhanced with:
 * - Refresh token storage for JWT rotation
 * - Automatic timestamps (createdAt, updatedAt)
 * - Compound index on email for fast lookups
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password by default
    },

    refreshToken: {
      type: String,
      select: false, // Never return refresh token by default
    },
  },
  {
    timestamps: true, // Auto createdAt and updatedAt
  }
);

// ─── Indexes ─────────────────────────────────────────────────
// Email index for login lookups (unique already creates one, but explicit for clarity)
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
