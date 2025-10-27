import mongoose from 'mongoose';
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://masasu74:salomon123!@creditjambo.fad5qrn.mongodb.net/creditjambo_savings?retryWrites=true&w=majority&appName=creditjambo';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testPasswordComparison = async () => {
  try {
    await connectDB();
    
    const adminEmail = 'admin@creditjambo.com';
    const testPassword = 'password123';
    
    // Find the admin user with password field
    const adminUser = await User.findOne({ email: adminEmail }).select('+password');
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Testing password comparison...');
    console.log('Stored password hash:', adminUser.password);
    
    // Test bcrypt comparison
    const isMatch = await bcrypt.compare(testPassword, adminUser.password);
    console.log('Password match result:', isMatch);
    
    // Test the model's comparePassword method
    const modelMatch = await adminUser.comparePassword(testPassword);
    console.log('Model comparePassword result:', modelMatch);
    
  } catch (error) {
    console.error('Error testing password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

testPasswordComparison();
