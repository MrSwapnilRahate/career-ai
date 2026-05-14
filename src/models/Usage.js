/**
 * Usage Tracker Model
 * 
 * Tracks monthly feature usage per user for subscription limit enforcement.
 * Resets each billing cycle.
 */

const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Format: "2026-05" — resets each month
  month: {
    type: String,
    required: true,
  },
  analyses: { type: Number, default: 0 },
  jobMatches: { type: Number, default: 0 },
  resumeGenerations: { type: Number, default: 0 },
  linkedinAnalyses: { type: Number, default: 0 },
  photoGenerations: { type: Number, default: 0 },
  coverPhotoGenerations: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Compound index for fast lookups
usageSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Usage', usageSchema);
