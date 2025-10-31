# Credit Jambo Savings Management API Documentation

## Postman Collection

A comprehensive Postman collection is available at `Credit_Jambo_API.postman_collection.json` with all API endpoints organized by category.

### Importing the Collection

1. Open Postman
2. Click **Import** button
3. Select `Credit_Jambo_API.postman_collection.json`
4. The collection will be imported with all endpoints organized in folders

### Setting Up Environment Variables

Create a Postman environment with the following variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `base_url` | Base URL of the API | `http://localhost:4000` |
| `admin_token` | JWT token for admin authentication | (Obtained from Admin Login) |
| `customer_token` | JWT token for customer authentication | (Obtained from Customer Login) |
| `device_id` | Device ID for customer requests | `device-unique-id-12345` |

### Using the Collection

1. **Set Environment**: Select your environment from the dropdown
2. **Admin Authentication**: 
   - Use "Admin Login" endpoint to get admin token
   - Copy the token from response
   - Update `admin_token` in environment variables
3. **Customer Authentication**:
   - Use "Customer Register" to create an account
   - Admin must verify the device using "Verify Device" endpoint
   - Use "Customer Login" to get customer token
   - Copy the token from response
   - Update `customer_token` in environment variables

### Endpoint Categories

#### Authentication
- Admin Login/Logout
- Customer Registration/Login
- Get Current User

#### Device Verification
- Register Device
- Get Pending Verifications
- Verify/Reject Device
- Get Device Statistics

#### Savings Accounts
- Create/Get/Update Accounts (Admin)
- Customer Self-Service Accounts
- Account Statistics
- Low Balance Reports

#### Transactions
- Deposit/Withdraw (Admin)
- Customer Deposit/Withdraw
- Transaction History
- Transaction Statistics

#### Customers
- Get All Customers
- Get Customer by ID
- Update Customer
- Customer Statistics

#### Account Products
- Get Active Products
- Create/Update Products (Admin)

#### System
- Health Check

---

## API Testing

### Running Tests

The backend includes Jest test suite for testing controllers and core functionality.

#### Install Dependencies

```bash
npm install
```

#### Run All Tests

```bash
npm test
```

#### Run Tests in Watch Mode

```bash
npm run test:watch
```

#### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Structure

```
backend/
├── tests/
│   ├── setup.js                          # Test configuration and database setup
│   └── controllers/
│       ├── customerAuthController.test.js
│       ├── transactionController.test.js
│       └── savingsAccountController.test.js
├── jest.config.js                       # Jest configuration
└── package.json                         # Test scripts
```

### Test Database

Tests use a separate test database. Set the `MONGODB_URI_TEST` environment variable:

```bash
export MONGODB_URI_TEST="mongodb://localhost:27017/credit-jambo-test"
```

Or add to `.env` file:

```
MONGODB_URI_TEST=mongodb://localhost:27017/credit-jambo-test
```

### Writing New Tests

1. Create test file in `tests/controllers/` or appropriate directory
2. Import necessary models and controllers
3. Use `beforeEach` to set up test data
4. Use `afterEach` to clean up (handled automatically in setup.js)
5. Write test cases using Jest's `describe` and `it` blocks

Example:

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { myController } from '../../controllers/myController.js';

describe('My Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = { body: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should handle request correctly', async () => {
    // Test implementation
    await myController(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});
```

### Test Coverage

Current test coverage includes:

- ✅ Customer Authentication (Registration, Login)
- ✅ Device Verification
- ✅ Transaction Processing (Deposits, Withdrawals)
- ✅ Balance Validation
- ✅ Savings Account Management
- ✅ Low Balance Detection

### Continuous Integration

To run tests in CI/CD pipelines:

```bash
# Set test database URI
export MONGODB_URI_TEST="mongodb://localhost:27017/credit-jambo-test"

# Run tests
npm test

# Generate coverage report
npm run test:coverage
```

---

## API Endpoints Overview

### Base URL
```
http://localhost:4000/api
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited:
- General API: 500 requests per 15 minutes
- Authentication: 10 requests per 15 minutes
- MFA: 5 requests per 5 minutes

---

## Support

For API support, contact:
- Email: hello@creditjambo.com
- Phone: +250 788 268 451

