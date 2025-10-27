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

const createNewAdmin = async () => {
  try {
    await connectDB();
    
    // Delete existing admin user
    await User.deleteOne({ email: 'admin@creditjambo.com' });
    console.log('Deleted existing admin user');
    
    // Create new admin user
    const newAdmin = new User({
      fullName: 'Credit Jambo Admin',
      email: 'admin@creditjambo.com',
      password: 'password123',
      role: 'admin',
      isActive: true,
      firstLogin: true
    });
    
    await newAdmin.save();
    console.log('New admin user created successfully');
    console.log('Email:', newAdmin.email);
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

createNewAdmin();
