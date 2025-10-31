import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
import SavingsAccount from '../../models/savingsAccountModel.js';
import Customer from '../../models/customerModel.js';
import { 
  createSavingsAccount, 
  getSavingsAccounts, 
  getSavingsAccountById,
  getLowBalanceAccounts 
} from '../../controllers/savingsAccountController.js';

describe('Savings Account Controller', () => {
  let mockReq, mockRes;
  let testCustomer;

  beforeEach(async () => {
    testCustomer = await Customer.create({
      customerCode: 'CUST-ACC',
      personalInfo: { fullName: 'Account Test User' },
      contact: { email: 'account@example.com', phone: '+250788444444' },
      password: 'password123',
      isActive: true,
    });

    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'admin-user-id' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createSavingsAccount', () => {
    it('should create a savings account successfully', async () => {
      mockReq.body = {
        customerId: testCustomer._id.toString(),
        accountType: 'regular',
        minimumBalance: 1000,
        interestRate: 5.5,
      };

      await createSavingsAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accountType: 'regular',
          }),
        })
      );
    });

    it('should return 404 for non-existent customer', async () => {
      mockReq.body = {
        customerId: '507f1f77bcf86cd799439011',
        accountType: 'regular',
      };

      await createSavingsAccount(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSavingsAccounts', () => {
    beforeEach(async () => {
      // Create test accounts
      await SavingsAccount.create({
        customerId: testCustomer._id,
        accountNumber: 'SAV1111111111',
        accountType: 'regular',
        balance: 5000,
        status: 'active',
      });

      await SavingsAccount.create({
        customerId: testCustomer._id,
        accountNumber: 'SAV2222222222',
        accountType: 'premium',
        balance: 10000,
        status: 'active',
      });
    });

    it('should get all savings accounts with pagination', async () => {
      mockReq.query = {
        page: '1',
        limit: '10',
      };

      await getSavingsAccounts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accounts: expect.any(Array),
            pagination: expect.any(Object),
          }),
        })
      );
    });

    it('should filter accounts by status', async () => {
      mockReq.query = {
        status: 'active',
        page: '1',
        limit: '10',
      };

      await getSavingsAccounts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.accounts.every(acc => acc.status === 'active')).toBe(true);
    });
  });

  describe('getSavingsAccountById', () => {
    let testAccount;

    beforeEach(async () => {
      testAccount = await SavingsAccount.create({
        customerId: testCustomer._id,
        accountNumber: 'SAV3333333333',
        accountType: 'regular',
        balance: 3000,
        status: 'active',
      });
    });

    it('should get account by ID successfully', async () => {
      mockReq.params.id = testAccount._id.toString();

      await getSavingsAccountById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accountNumber: 'SAV3333333333',
          }),
        })
      );
    });

    it('should return 404 for non-existent account', async () => {
      mockReq.params.id = '507f1f77bcf86cd799439011';

      await getSavingsAccountById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getLowBalanceAccounts', () => {
    beforeEach(async () => {
      // Create accounts with different balances
      await SavingsAccount.create({
        customerId: testCustomer._id,
        accountNumber: 'SAV-LOW-001',
        accountType: 'regular',
        balance: 500, // Low balance
        status: 'active',
      });

      await SavingsAccount.create({
        customerId: testCustomer._id,
        accountNumber: 'SAV-HIGH-001',
        accountType: 'regular',
        balance: 5000, // High balance
        status: 'active',
      });
    });

    it('should return accounts below threshold', async () => {
      mockReq.query = {
        threshold: '1000',
      };

      await getLowBalanceAccounts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.data.every(acc => acc.balance < 1000)).toBe(true);
    });
  });
});

