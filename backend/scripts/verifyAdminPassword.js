import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

const verifyAdminPassword = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://masasu74:salomon123!@creditjambo.fad5qrn.mongodb.net/creditjambo_savings?retryWrites=true&w=majority&appName=creditjambo';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database');

    // Find the admin user (explicitly select password field)
    const adminUser = await User.findOne({ email: 'admin@creditjambo.com' }).select('+password');
    if (!adminUser) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('👤 Found admin user:', adminUser.email);
    console.log('🔑 Stored password hash:', adminUser.password.substring(0, 20) + '...');

    // Test password verification
    const testPassword = 'salomon123!';
    const isMatch = await bcrypt.compare(testPassword, adminUser.password);
    
    console.log('🔍 Testing password:', testPassword);
    console.log('✅ Password match:', isMatch);

    if (isMatch) {
      console.log('🎉 Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
      
      // Try to rehash and save
      console.log('🔄 Rehashing password...');
      const saltRounds = 12;
      const newHashedPassword = await bcrypt.hash(testPassword, saltRounds);
      adminUser.password = newHashedPassword;
      adminUser.updatedAt = new Date();
      await adminUser.save();
      
      console.log('✅ Password rehashed and saved');
      
      // Test again
      const isMatchAfterRehash = await bcrypt.compare(testPassword, adminUser.password);
      console.log('🔍 Testing password after rehash:', isMatchAfterRehash);
    }

  } catch (error) {
    console.error('❌ Error verifying admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

// Run the script
verifyAdminPassword();
