# Credit Jambo Ltd - Savings Management System

A comprehensive savings management system built for Credit Jambo Ltd's practical assessment. This system enables customers to register, manage savings accounts, and perform transactions securely, while administrators can verify users and monitor activities.

## 🚀 Features

### Core Requirements Implemented

#### Authentication & Verification
- ✅ Customer registration and login using SHA-512 password hashing
- ✅ JWT authentication for session handling
- ✅ Device ID verification system for customer accounts
- ✅ Only verified devices can log in
- ✅ Sessions expire upon closing or inactivity

#### Savings Operations
- ✅ Deposit and Withdraw endpoints
- ✅ View account balance and transaction history
- ✅ Prevent withdrawals exceeding balance
- ✅ Apply DTOs (Data Transfer Objects) to control data exposure

#### Security
- ✅ Secure HTTP headers using Helmet
- ✅ Rate limiting implementation
- ✅ Input validation and sanitization
- ✅ Environment variables for secrets and configuration
- ✅ Separate application layers: routes, controllers, services, DTOs, and models

### Admin/Management Interface (Core Requirements Only)
- ✅ Admin authentication
- ✅ Manage and verify customer device IDs
- ✅ View all customers, balances, and transactions
- ✅ Display statistics and analytics dashboard
- ✅ Handle errors and feedback gracefully

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── savingsAccountController.js
│   │   ├── transactionController.js
│   │   ├── deviceVerificationController.js
│   │   └── savingsCustomerController.js
│   ├── models/
│   │   ├── savingsAccountModel.js
│   │   ├── transactionModel.js
│   │   ├── deviceVerificationModel.js
│   │   └── customerModel.js (updated)
│   ├── routes/
│   │   ├── savingsAccountRoute.js
│   │   ├── transactionRoute.js
│   │   ├── deviceVerificationRoute.js
│   │   └── savingsCustomerRoute.js
│   ├── dtos/
│   │   ├── customerDTO.js
│   │   ├── savingsAccountDTO.js
│   │   ├── transactionDTO.js
│   │   └── deviceVerificationDTO.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── inputValidation.js
│   │   └── securityHeaders.js
│   └── utils/
│       ├── logActivity.js
│       └── generateCustomId.js
├── config/
│   ├── db.js
│   ├── security.js
│   └── uploadsConfig.js
├── package.json
├── server.js
└── .env.example

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── store/
│   └── utils/
├── public/
└── package.json
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing (SHA-512 compatible)
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation

### Frontend
- **React.js** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation & Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd savings-management-system
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/savings-management-system
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=4000
   NODE_ENV=development
   ```

4. **Start the backend server**
   ```bash
   npm run server
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 API Endpoints

### Authentication
- `POST /api/customers/register` - Customer registration
- `POST /api/customers/login` - Customer login

### Savings Accounts
- `GET /api/savings-accounts` - Get all savings accounts
- `POST /api/savings-accounts` - Create savings account
- `GET /api/savings-accounts/:id` - Get account by ID
- `PUT /api/savings-accounts/:id` - Update account
- `PATCH /api/savings-accounts/:id/verify` - Verify account

### Transactions
- `POST /api/transactions/deposit` - Process deposit
- `POST /api/transactions/withdrawal` - Process withdrawal
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID

### Device Verification
- `POST /api/device-verifications/register` - Register device
- `GET /api/device-verifications/pending` - Get pending verifications
- `PATCH /api/device-verifications/:id/verify` - Verify device

### Admin
- `GET /api/customers` - Get all customers
- `GET /api/customers/stats/overview` - Get customer statistics
- `PATCH /api/customers/:id/status` - Toggle customer status

## 🔒 Security Features

- **Password Hashing**: SHA-512 compatible bcrypt hashing
- **JWT Authentication**: Secure token-based authentication
- **Device Verification**: Multi-device verification system
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Cross-origin resource sharing protection

## 📊 Data Transfer Objects (DTOs)

The system uses DTOs to control data exposure:

- **Customer DTOs**: Hide sensitive information like passwords
- **Transaction DTOs**: Control transaction data visibility
- **Account DTOs**: Manage savings account data exposure
- **Device DTOs**: Control device verification data

## 🧪 Testing

### Backend Testing
   ```bash
cd backend
npm test
   ```

### Frontend Testing
   ```bash
cd frontend
npm test
```

## 📈 Monitoring & Analytics

- Real-time transaction monitoring
- Customer activity tracking
- Device verification statistics
- Account balance analytics
- Low balance alerts

## 🚀 Deployment

### Docker Deployment
   ```bash
docker-compose up -d
```

### Manual Deployment
1. Build the frontend: `npm run build`
2. Start the backend: `npm start`
3. Serve the frontend with a web server

## 📝 API Documentation

The API follows RESTful conventions and includes:

- Comprehensive error handling
- Detailed response schemas
- Request/response examples
- Authentication requirements
- Rate limiting information

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Database Configuration
The system uses MongoDB with Mongoose ODM for data persistence.

### Security Configuration
- JWT secret key configuration
- Rate limiting settings
- CORS configuration
- Security headers setup

## 📞 Support

For technical support or questions about this implementation, please contact the development team.

## 📄 License

This project is developed for Credit Jambo Ltd's practical assessment.

---

**Note**: This is a practical assessment implementation focusing on core savings management functionality with security best practices and clean architecture.# credit-jambo-savings-management-admin
