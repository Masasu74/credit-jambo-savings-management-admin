import express from 'express';
import { uploadToCloudinary } from '../middleware/cloudinaryUpload.js';
import cloudinaryService from '../services/cloudinaryService.js';

const cloudinaryTestRouter = express.Router();

// Test upload endpoint
cloudinaryTestRouter.post('/test-upload', 
  uploadToCloudinary('file', 1, { folder: 'test' }),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const file = req.files[0];
      const cloudinaryResult = file.cloudinary;

      res.json({
        success: true,
        message: 'File uploaded successfully to Cloudinary',
        data: {
          originalName: file.originalname,
          size: file.size,
          type: file.mimetype,
          cloudinaryUrl: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Test logo upload endpoint (without auth)
cloudinaryTestRouter.post('/test-logo-upload', 
  uploadToCloudinary('file', 1, { folder: 'system-settings' }),
  async (req, res) => {
    try {
      console.log('🔧 Test Logo Upload Debug:', {
        cloudinaryResults: req.cloudinaryResults?.length || 0,
        files: req.files?.length || 0
      });

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const file = req.files[0];
      const cloudinaryResult = file.cloudinary;

      res.json({
        success: true,
        message: 'Logo uploaded successfully to Cloudinary',
        data: {
          originalName: file.originalname,
          size: file.size,
          type: file.mimetype,
          cloudinaryUrl: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Test configuration endpoint
cloudinaryTestRouter.get('/config', (req, res) => {
  const config = cloudinaryService.getConfigStatus();
  res.json({
    success: true,
    config
  });
});

export default cloudinaryTestRouter;
