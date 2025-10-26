import multer from 'multer';
import { promisify } from 'util';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Create middleware for processing multipart form data
const processFormData = upload.fields([
  { name: 'receipts', maxCount: 5 }, // Allow up to 5 receipt files
  { name: 'collateral', maxCount: 1 }
]);

// Async wrapper for multer middleware
const processFormDataAsync = (req, res) => {
  return new Promise((resolve, reject) => {
    processFormData(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Legacy function for simple form data processing (keeping for backward compatibility)
const processSimpleFormData = (body) => {
  const processed = {};
  for (const key in body) {
    if (key.startsWith('collateral[')) {
      const prop = key.match(/\[(.*?)\]/)[1];
      if (!processed.collateral) processed.collateral = {};
      processed.collateral[prop] = body[key];
    } else {
      processed[key] = body[key];
    }
  }
  return processed;
};

export { processFormData, processFormDataAsync, processSimpleFormData };
export default processFormData;