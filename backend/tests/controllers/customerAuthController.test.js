import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Customer from '../../models/customerModel.js';
import DeviceVerification from '../../models/deviceVerificationModel.js';
import { registerCustomer, loginCustomer } from '../../controllers/customerAuthController.js';

// Mock dependencies
jest.mock('../../utils/logActivity.js', () => ({
  logActivity: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../utils/generateCustomId.js', () => ({
  generateCustomId: jest.fn().mockResolvedValue('CUST-001'),
}));

describe('Customer Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {},
      get: jest.fn(),
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerCustomer', () => {
    it('should register a new customer successfully', async () => {
      mockReq.body = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+250788123456',
      };
      mockReq.headers['x-device-id'] = 'device-123';

      await registerCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          token: expect.any(String),
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      mockReq.body = {
        email: 'john@example.com',
        // Missing fullName, password, phone
      };

      await registerCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
        })
      );
    });

    it('should return 409 for duplicate email', async () => {
      // Create existing customer
      await Customer.create({
        customerCode: 'CUST-EXIST',
        personalInfo: { fullName: 'Existing User' },
        contact: { email: 'existing@example.com', phone: '+250788999999' },
        password: 'hashedpassword',
      });

      mockReq.body = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '+250788123456',
      };

      await registerCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('loginCustomer', () => {
    beforeEach(async () => {
      // Create a test customer with verified device
      const customer = await Customer.create({
        customerCode: 'CUST-TEST',
        personalInfo: { fullName: 'Test User' },
        contact: { email: 'test@example.com', phone: '+250788111111' },
        password: 'password123', // Will be hashed automatically
        isActive: true,
      });

      // Create verified device
      await DeviceVerification.create({
        customerId: customer._id,
        deviceId: 'device-verified',
        deviceInfo: {
          userAgent: 'test',
          platform: 'Mobile',
          browser: 'Chrome',
          os: 'Android',
        },
        ipAddress: '127.0.0.1',
        status: 'verified',
        isActive: true,
      });
    });

    it('should login customer with valid credentials and verified device', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      mockReq.headers['x-device-id'] = 'device-verified';

      await loginCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockReq.headers['x-device-id'] = 'device-verified';

      await loginCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 for unverified device', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      mockReq.headers['x-device-id'] = 'device-unverified';

      await loginCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('device'),
        })
      );
    });

    it('should return 400 for missing device ID', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };
      // No x-device-id header

      await loginCustomer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

