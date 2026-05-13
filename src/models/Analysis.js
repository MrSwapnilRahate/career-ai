const mongoose = require('mongoose');

/**
 * Analysis Model
 * 
 * Stores resume analysis results with:
 * - Job queue tracking (status, jobId) for async processing
 * - File metadata (size, type, upload timestamp)
 * - Structured AI result fields for querying
 * - Performance indexes for scalability
 */

const ANALYSIS_STATUSES = ['queued', 'processing', 'extracting', 'analyzing', 'completed', 'failed'];

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─── Job Queue Tracking ────────────────────────────────────
    jobId: {
      type: String,
      index: true,
    },

    status: {
      type: String,
      enum: ANALYSIS_STATUSES,
      default: 'queued',
    },

    // ─── Resume Data ───────────────────────────────────────────
    resumeText: {
      type: String,
    },

    jobDescription: {
      type: String,
    },

    // ─── File Metadata ─────────────────────────────────────────
    fileMetadata: {
      originalName: { type: String },
      fileSize: { type: Number },         // bytes
      mimeType: { type: String },
      fileUrl: { type: String },          // Cloudinary URL
      uploadedAt: { type: Date, default: Date.now },
    },

    // ─── Analysis Type ─────────────────────────────────────────
    analysisType: {
      type: String,
      enum: ['resume-analysis', 'job-match'],
      default: 'resume-analysis',
    },

    // ─── AI Result (Structured) ────────────────────────────────
    aiResult: {
      score: { type: Number, default: 0 },
      atsScore: { type: Number, default: 0 },
      skills: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
      summary: { type: String, default: '' },
      // Job match specific fields
      matchScore: { type: Number },
      missingSkills: { type: [String] },
    },

    // ─── Performance Tracking ──────────────────────────────────
    processingTimeMs: {
      type: Number, // Total processing time in milliseconds
    },

    // ─── Error Tracking ────────────────────────────────────────
    error: {
      message: { type: String },
      occurredAt: { type: Date },
    },
  },
  {
    timestamps: true, // Auto createdAt and updatedAt
  }
);

// ─── Indexes for Performance ──────────────────────────────────
// Primary query pattern: find analyses by user, sorted by date
analysisSchema.index({ userId: 1, createdAt: -1 });

// Job status polling: find by jobId
analysisSchema.index({ jobId: 1 });

// Admin/monitoring: find by status
analysisSchema.index({ status: 1 });

// Export status enum for use in other files
analysisSchema.statics.STATUSES = ANALYSIS_STATUSES;

module.exports = mongoose.model('Analysis', analysisSchema);
