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

const resetAdminPassword = async () => {
  try {
    await connectDB();
    
    const adminEmail = 'admin@creditjambo.com';
    const newPassword = 'password123';
    
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Find and update the admin user
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    console.log('Admin password reset successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', newPassword);
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

resetAdminPassword();