import multer from 'multer';
import cloudinaryService from '../services/cloudinaryService.js';

// Memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX'));
  }
};

const cloudinaryUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files
  }
});

// Enhanced upload middleware for Cloudinary with local fallback
export const uploadToCloudinary = (fieldName, maxCount = 1, options = {}) => {
  return async (req, res, next) => {
    try {
      // Check if Cloudinary is enabled
      const cloudinaryEnabled = process.env.ENABLE_CLOUDINARY === 'true';
      
      // Handle file upload
      // Accept any file fields to avoid Multer "Unexpected field" when client sends named fields
      cloudinaryUpload.any()(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File too large. Maximum allowed size is 10MB'
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field || 'unknown'}` });
          }
          return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        // Upload files to Cloudinary if enabled, otherwise use local storage
        if (req.files && req.files.length > 0) {
          if (cloudinaryEnabled) {
            try {
              const uploadResults = await cloudinaryService.uploadFiles(req.files, options);
              
              // Add Cloudinary results to request
              req.cloudinaryResults = uploadResults;
              
              // Keep original files for backward compatibility
              req.files = req.files.map((file, index) => ({
                ...file,
                cloudinary: uploadResults[index]
              }));
              
              console.log(`✅ Uploaded ${req.files.length} files to Cloudinary`);

            } catch (uploadError) {
              console.error('⚠️ Cloudinary upload failed, using local storage fallback:', uploadError.message);
              // Continue with local files - don't fail the request
              req.cloudinaryFailed = true;
            }
          } else {
            console.log(`📦 Cloudinary disabled, files stored in memory for local processing`);
            req.cloudinaryDisabled = true;
          }
        }

        next();
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Upload middleware error: ${error.message}`
      });
    }
  };
};

export { cloudinaryUpload };
