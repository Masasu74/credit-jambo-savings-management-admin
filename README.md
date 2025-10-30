# Credit Jambo Admin Management System

A comprehensive admin panel for managing the Credit Jambo savings management system, built with React frontend and Node.js/Express backend.

## Project Structure

```
credit-jambo-savings-management-admin/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── dist/                # Build output
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── dtos/            # Data Transfer Objects
│   │   ├── middlewares/     # Custom middleware
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   ├── tests/               # Test files
│   └── logs/                # Application logs
├── .env.example             # Environment variables template
└── README.md               # This file
```

## Features

### Admin Features
- **Admin Authentication**: Secure admin login with JWT tokens
- **Customer Management**: View, verify, and manage customer accounts
- **Device Verification**: Approve or reject customer device registrations
- **Transaction Monitoring**: View all customer transactions and balances
- **Analytics Dashboard**: Real-time statistics and reporting
- **User Management**: Manage admin users and permissions
- **System Settings**: Configure system parameters and settings

### Security Features
- JWT token authentication
- Role-based access control (RBAC)
- Rate limiting and security headers
- Input validation and sanitization
- Audit logging for all admin actions
- Advanced caching with Redis
- Performance monitoring

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis (optional, for caching)
- Git

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/credit-jambo-admin
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=24h
FRONTEND_URL=http://localhost:3000
```

5. Start the backend server:
```bash
# Development
npm run server

# Production
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Docker Setup

### Using Docker Compose

1. Navigate to the project root:
```bash
cd credit-jambo-savings-management-admin
```

2. Start all services:
```bash
docker-compose up -d
```

3. Check service status:
```bash
docker-compose ps
```

4. View logs:
```bash
docker-compose logs -f
```

### Individual Docker Commands

```bash
# Build and run backend
docker build -t credit-jambo-admin-backend ./backend
docker run -p 4000:4000 credit-jambo-admin-backend

# Build and run frontend
docker build -t credit-jambo-admin-frontend ./frontend
docker run -p 3000:3000 credit-jambo-admin-frontend
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/profile` - Get admin profile
- `PUT /api/auth/profile` - Update admin profile

### Customer Management
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id/verify` - Verify customer account
- `PUT /api/customers/:id/status` - Update customer status

### Device Verification
- `GET /api/device-verifications` - Get pending device verifications
- `PUT /api/device-verifications/:id/approve` - Approve device
- `PUT /api/device-verifications/:id/reject` - Reject device

### Transaction Management
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/customer/:customerId` - Get customer transactions

### Savings Account Management
- `GET /api/savings-accounts` - Get all savings accounts
- `GET /api/savings-accounts/:id` - Get account details
- `PUT /api/savings-accounts/:id` - Update account settings

### Analytics & Reporting
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/customers` - Get customer analytics
- `GET /api/analytics/transactions` - Get transaction analytics
- `GET /api/analytics/reports` - Generate reports

### System Management
- `GET /api/system/health` - System health check
- `GET /api/system/settings` - Get system settings
- `PUT /api/system/settings` - Update system settings

## Database Models

### Admin User
- Admin authentication and profile information
- Role-based permissions
- Activity tracking

### Customer
- Customer information and verification status
- Account status and security settings
- Contact and address information

### Savings Account
- Account details and balance information
- Interest rates and account settings
- Transaction history

### Transaction
- Transaction details and metadata
- Balance tracking and status
- Audit trail information

### Device Verification
- Device registration and verification
- Admin approval workflow
- Security and location tracking

## Security Features

1. **Authentication**: JWT-based admin authentication
2. **Authorization**: Role-based access control (RBAC)
3. **Rate Limiting**: API endpoints protected against abuse
4. **Input Validation**: All inputs validated and sanitized
5. **Security Headers**: Comprehensive security headers
6. **Audit Logging**: All admin actions are logged
7. **Data Encryption**: Sensitive data encrypted at rest
8. **CORS Protection**: Configured CORS policies

## Development

### Running Tests
```bash
cd backend
npm test
```

### Code Linting
```bash
cd frontend
npm run lint
```

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## Performance Features

- **Redis Caching**: Advanced caching for improved performance
- **Query Optimization**: Database query optimization
- **Performance Monitoring**: Real-time performance metrics
- **Memory Management**: Optimized memory usage
- **Response Compression**: Gzip compression for responses

## Monitoring & Logging

- **Health Checks**: System health monitoring
- **Performance Metrics**: Real-time performance tracking
- **Audit Logs**: Comprehensive activity logging
- **Error Tracking**: Detailed error logging and tracking
- **System Monitoring**: Resource usage monitoring

## Deployment

### Production Deployment
1. Set up MongoDB database
2. Configure Redis (optional)
3. Set environment variables
4. Install dependencies
5. Build frontend
6. Start backend server
7. Configure reverse proxy (nginx)

### Environment Variables
See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software owned by Credit Jambo Ltd.

## Support

For support and questions, contact:
- Email: hello@creditjambo.com
- Phone: +250 788 268 451
- Website: www.creditjambo.com