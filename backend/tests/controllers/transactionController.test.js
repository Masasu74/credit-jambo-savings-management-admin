import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import Transaction from '../../models/transactionModel.js';
import SavingsAccount from '../../models/savingsAccountModel.js';
import Customer from '../../models/customerModel.js';
import { processDeposit, processWithdrawal, customerDeposit, customerWithdrawal } from '../../controllers/transactionController.js';

describe('Transaction Controller', () => {
  let mockReq, mockRes;
  let testCustomer, testAccount;

  beforeEach(async () => {
    // Create test customer
    testCustomer = await Customer.create({
      customerCode: 'CUST-TXN',
      personalInfo: { fullName: 'Transaction Test User' },
      contact: { email: 'txn@example.com', phone: '+250788222222' },
      password: 'password123',
      isActive: true,
    });

    // Create test savings account
    testAccount = await SavingsAccount.create({
      customerId: testCustomer._id,
      accountNumber: 'SAV1234567890',
      accountType: 'regular',
      balance: 5000,
      minimumBalance: 1000,
      status: 'active',
      isVerified: true,
    });

    mockReq = {
      body: {},
      headers: {},
      user: { _id: 'admin-user-id' },
      customer: { customerId: testCustomer._id },
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

  describe('processDeposit', () => {
    it('should process deposit successfully', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 2000,
        description: 'Test deposit',
      };

      await processDeposit(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            newBalance: 7000, // 5000 + 2000
          }),
        })
      );

      // Verify balance was updated
      const updatedAccount = await SavingsAccount.findById(testAccount._id);
      expect(updatedAccount.balance).toBe(7000);
    });

    it('should return 400 for invalid amount', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: -100,
        description: 'Invalid deposit',
      };

      await processDeposit(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent account', async () => {
      mockReq.body = {
        accountId: '507f1f77bcf86cd799439011',
        amount: 1000,
      };

      await processDeposit(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('processWithdrawal', () => {
    it('should process withdrawal successfully', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 2000,
        description: 'Test withdrawal',
      };

      await processWithdrawal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            newBalance: 3000, // 5000 - 2000
          }),
        })
      );

      // Verify balance was updated
      const updatedAccount = await SavingsAccount.findById(testAccount._id);
      expect(updatedAccount.balance).toBe(3000);
    });

    it('should return 400 for insufficient balance', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 10000, // More than balance
        description: 'Overdraft attempt',
      };

      await processWithdrawal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('balance'),
        })
      );
    });

    it('should return 400 for violation of minimum balance', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 4500, // Would leave 500, less than minimum 1000
        description: 'Minimum balance violation',
      };

      await processWithdrawal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('customerDeposit', () => {
    it('should allow customer to deposit to own account', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 1500,
        description: 'Customer deposit',
      };
      mockReq.customer = { customerId: testCustomer._id };

      await customerDeposit(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      
      const updatedAccount = await SavingsAccount.findById(testAccount._id);
      expect(updatedAccount.balance).toBe(6500);
    });

    it('should return 403 for deposit to other customer account', async () => {
      const otherCustomer = await Customer.create({
        customerCode: 'CUST-OTHER',
        personalInfo: { fullName: 'Other User' },
        contact: { email: 'other@example.com', phone: '+250788333333' },
        password: 'password123',
      });

      const otherAccount = await SavingsAccount.create({
        customerId: otherCustomer._id,
        accountNumber: 'SAV9876543210',
        accountType: 'regular',
        balance: 1000,
        status: 'active',
      });

      mockReq.body = {
        accountId: otherAccount._id.toString(),
        amount: 500,
      };
      mockReq.customer = { customerId: testCustomer._id };

      await customerDeposit(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('customerWithdrawal', () => {
    it('should allow customer to withdraw from own account', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 1500,
        description: 'Customer withdrawal',
      };
      mockReq.customer = { customerId: testCustomer._id };

      await customerWithdrawal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      
      const updatedAccount = await SavingsAccount.findById(testAccount._id);
      expect(updatedAccount.balance).toBe(3500);
    });

    it('should prevent withdrawal exceeding balance', async () => {
      mockReq.body = {
        accountId: testAccount._id.toString(),
        amount: 6000, // More than current balance
      };
      mockReq.customer = { customerId: testCustomer._id };

      await customerWithdrawal(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('balance'),
        })
      );
    });
  });
});

