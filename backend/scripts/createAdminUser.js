import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://masasu74:salomon123!@creditjambo.fad5qrn.mongodb.net/creditjambo_savings?retryWrites=true&w=majority&appName=creditjambo';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@creditjambo.com' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log('Email: admin@creditjambo.com');
      console.log('Password: salomon123!');
      process.exit(0);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('salomon123!', saltRounds);

    // Create admin user
    const adminUser = new User({
      fullName: 'Credit Jambo Admin',
      email: 'admin@creditjambo.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      branch: null, // Admin doesn't belong to a specific branch
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@creditjambo.com');
    console.log('🔑 Password: salomon123!');
    console.log('👤 Role: admin');
    console.log('✅ Status: active');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
