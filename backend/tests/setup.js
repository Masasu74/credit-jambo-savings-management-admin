// Test setup file
import mongoose from 'mongoose';

// Set test timeout
jest.setTimeout(10000);

// Setup before all tests
beforeAll(async () => {
  // Use test database
  const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/credit-jambo-test';
  
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(testDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test database connection failed:', error);
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Drop test database collections
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    await mongoose.connection.close();
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections after each test
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Mock environment variables for testing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
