import express from "express";
import {
  getSystemSettings,
  updateSystemSettings,
  resetSystemSettings,
  getPublicSystemSettings,
  exportSettings,
  importSettings,
  uploadLogo,
  uploadFavicon,
  generateBackup,
  restoreBackup,
  backupHealthCheck
} from "../controllers/systemSettingsController.js";
import authMiddleware from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { uploadToCloudinary } from "../middleware/cloudinaryUpload.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// CORS middleware for system settings
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Public route for getting basic system settings (used in login page, etc.)
router.get("/public", getPublicSystemSettings);

// Health check for backup system (no authentication required)
router.get("/backup/health", backupHealthCheck);

// Protected routes - only admin and manager can access
router.use(authMiddleware);

// Get system settings
router.get("/", authorize(["admin", "manager"]), getSystemSettings);

// Update system settings
router.put("/", authorize(["admin", "manager"]), updateSystemSettings);

// Reset system settings to defaults
router.post("/reset", authorize(["admin"]), resetSystemSettings);

// Export settings
router.get("/export", authorize(["admin", "manager"]), exportSettings);

// Import settings
router.post("/import", authorize(["admin"]), importSettings);

// Upload logo
router.post("/upload-logo", authorize(["admin", "manager"]), uploadToCloudinary('file', 1, { folder: 'system-settings' }), uploadLogo);

// Upload favicon
router.post("/upload-favicon", authorize(["admin", "manager"]), uploadToCloudinary('file', 1, { folder: 'system-settings' }), uploadFavicon);

// Generate backup for download
router.get("/backup", authorize(["admin"]), generateBackup);

// Configure multer for backup file upload
const backupUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'backups'));
    },
    filename: (req, file, cb) => {
      const uniqueName = `restore-${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON backup files are allowed'));
    }
  },
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB limit for backup files
    files: 1
  }
});

// Restore backup from file
router.post("/backup/restore", authorize(["admin"]), (req, res, next) => {
  backupUpload.single('backupFile')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Backup file too large. Maximum allowed size is 100MB'
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    } else if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    next();
  });
}, restoreBackup);

export default router;
