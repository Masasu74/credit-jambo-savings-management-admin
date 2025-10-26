import { v2 as cloudinary } from 'cloudinary';
import { logActivity } from '../utils/logActivity.js';
import 'dotenv/config.js';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

class CloudinaryService {
  constructor() {
    this.folder = process.env.CLOUDINARY_FOLDER || 'anchor-finance';
    this.uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'anchor_finance_uploads';
    this.enabled = process.env.ENABLE_CLOUDINARY === 'true';
  }

  // Upload single file
  async uploadFile(file, options = {}) {
    try {
      if (!file || !file.buffer) {
        throw new Error('Invalid file data');
      }

      const {
        folder = this.folder,
        transformation = {},
        publicId = null,
        tags = [],
        resourceType = 'auto'
      } = options;

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation,
            public_id: publicId,
            tags,
            resource_type: resourceType,
            overwrite: true,
            invalidate: true
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(file.buffer);
      });

      // Skip activity logging for now to avoid validation errors
      console.log('✅ File uploaded to Cloudinary:', {
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: result.secure_url,
        publicId: result.public_id
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload multiple files
  async uploadFiles(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        results.push({
          ...result,
          originalName: file.originalname,
          fieldName: file.fieldname
        });
      } catch (error) {
        results.push({
          success: false,
          originalName: file.originalname,
          fieldName: file.fieldname,
          error: error.message
        });
      }
    }

    return results;
  }

  // Delete file
  async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      console.log('✅ File deleted from Cloudinary:', { publicId, result });

      return { success: true, result };

    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Get file info
  async getFileInfo(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at
      };

    } catch (error) {
      console.error('Cloudinary get info error:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Generate signed upload URL
  async generateUploadSignature(params = {}) {
    try {
      const {
        folder = this.folder,
        publicId = null,
        resourceType = 'image',
        transformation = {},
        tags = []
      } = params;

      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
          public_id: publicId,
          resource_type: resourceType,
          transformation: JSON.stringify(transformation),
          tags: tags.join(',')
        },
        'sg-0j0Jpm_hjkUjCiM1ISwO6--0'
      );

      return {
        success: true,
        signature,
        timestamp,
        apiKey: '462383939955586',
        cloudName: 'dhxj5w0yg',
        uploadPreset: this.uploadPreset
      };

    } catch (error) {
      console.error('Cloudinary signature error:', error);
      throw new Error(`Failed to generate upload signature: ${error.message}`);
    }
  }

  // Transform image URL
  transformImageUrl(url, transformation = {}) {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return url;
      }

      const {
        width,
        height,
        crop = 'fill',
        quality = 'auto',
        format = 'auto'
      } = transformation;

      const cloudinaryUrl = cloudinary.url(url, {
        width,
        height,
        crop,
        quality,
        format
      });

      return cloudinaryUrl;

    } catch (error) {
      console.error('Cloudinary transform error:', error);
      return url;
    }
  }

  // Check configuration status
  getConfigStatus() {
    return {
      enabled: this.enabled,
      cloudName: 'dhxj5w0yg',
      apiKey: '462383939955586',
      folder: this.folder,
      uploadPreset: this.uploadPreset
    };
  }
}

export default new CloudinaryService();
