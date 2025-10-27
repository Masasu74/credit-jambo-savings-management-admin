import mongoose from 'mongoose';
import Branch from '../models/branchModel.js';
import User from '../models/userModel.js';
import 'dotenv/config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://masasu74:salomon123!@creditjambo.fad5qrn.mongodb.net/creditjambo_savings?retryWrites=true&w=majority&appName=creditjambo');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createInitialData = async () => {
  try {
    await connectDB();

    // Create a branch (or find existing)
    let branch = await Branch.findOne({ code: 'MAIN' });
    if (!branch) {
      branch = new Branch({
        name: 'Main Branch',
        code: 'MAIN',
        alias: 'main',
        contactInfo: {
          phone: '+250788123456',
          email: 'main@creditjambo.com',
          address: {
            street: 'NM 233 St, Nyamagumba',
            city: 'Musanze',
            province: 'Northern',
            postalCode: '00000'
          }
        },
        isActive: true,
        services: ['savings', 'transfers', 'payments'],
        settings: {
          allowOnlineRegistration: true,
          requireKYC: true,
          minDepositAmount: 1000,
          maxDepositAmount: 1000000
        }
      });
      await branch.save();
      console.log('Branch created:', branch);
    } else {
      console.log('Branch already exists:', branch);
    }

    // Create an admin user (or update if exists)
    let adminUser = await User.findOne({ email: 'admin@creditjambo.com' });
    if (!adminUser) {
      adminUser = new User({
        fullName: 'System Administrator',
        email: 'admin@creditjambo.com',
        password: 'admin123',
        role: 'admin',
        phoneNumber: '+250788123456',
        isActive: true,
        firstLogin: false
      });
      await adminUser.save();
      console.log('Admin user created:', adminUser);
    } else {
      console.log('Admin user already exists:', adminUser);
    }

    console.log('Initial data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating initial data:', error);
    process.exit(1);
  }
};

createInitialData();
