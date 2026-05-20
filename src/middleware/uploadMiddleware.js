/**
 * File Upload Middleware (Multer)
 * 
 * Supports two modes:
 * - Cloudinary storage (when CLOUD_NAME is configured)
 * - Memory storage (local development fallback)
 * 
 * Features:
 * - Support for PDF and DOC/DOCX file types
 * - 5MB file size limit
 * - Descriptive error messages
 */

const multer = require('multer');
const path = require('path');
const { config } = require('../config/environment');

// ─── Storage Configuration ────────────────────────────────────

let storage;

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  // Production: Cloudinary storage
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  const cloudinary = require('../utils/cloudinary');

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'resumes',
      resource_type: 'raw',
      public_id: (req, file) => {
        const timestamp = Date.now();
        const name = path.parse(file.originalname).name;
        return `${name}-${timestamp}`;
      },
    },
  });
} else {
  // Development: Memory storage (file available as req.file.buffer)
  storage = multer.memoryStorage();
}

// ─── Allowed File Types ───────────────────────────────────────
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * File filter — validates file type before upload.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
  const isValidMime = ALLOWED_MIMETYPES.includes(file.mimetype);

  if (isValidExt || isValidMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type '${ext}'. Only PDF, DOC, and DOCX files are allowed.`
      ),
      false
    );
  }
};

// ─── Multer Instance ──────────────────────────────────────────
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

module.exports = upload;
