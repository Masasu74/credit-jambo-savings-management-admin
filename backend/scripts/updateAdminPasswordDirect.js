import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

const updateAdminPasswordDirect = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://masasu74:salomon123!@creditjambo.fad5qrn.mongodb.net/creditjambo_savings?retryWrites=true&w=majority&appName=creditjambo';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@creditjambo.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('👤 Found admin user:', adminUser.email);

    // Hash the new password
    const saltRounds = 12;
    const newPassword = 'salomon123!';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password directly in the database (bypassing pre-save hook)
    await User.updateOne(
      { email: 'admin@creditjambo.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Admin password updated successfully!');
    console.log('📧 Email: admin@creditjambo.com');
    console.log('🔑 New Password: salomon123!');
    console.log('👤 Role: admin');
    console.log('✅ Status: active');

    // Verify the password
    const updatedUser = await User.findOne({ email: 'admin@creditjambo.com' }).select('+password');
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    console.log('🔍 Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

// Run the script
updateAdminPasswordDirect();
