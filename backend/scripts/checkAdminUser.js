import mongoose from 'mongoose';
import User from '../models/userModel.js';

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

const checkAdminUser = async () => {
  try {
    await connectDB();
    
    const adminEmail = 'admin@creditjambo.com';
    
    // Find the admin user with password field
    const adminUser = await User.findOne({ email: adminEmail }).select('+password');
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Admin user found:');
    console.log('Email:', adminUser.email);
    console.log('Full Name:', adminUser.fullName);
    console.log('Role:', adminUser.role);
    console.log('Is Active:', adminUser.isActive);
    console.log('Password exists:', !!adminUser.password);
    console.log('Password length:', adminUser.password ? adminUser.password.length : 0);
    console.log('Password starts with:', adminUser.password ? adminUser.password.substring(0, 10) + '...' : 'N/A');
    
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

checkAdminUser();
