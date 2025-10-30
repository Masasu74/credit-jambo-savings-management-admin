import mongoose from 'mongoose';
import 'dotenv/config.js';
import Transaction from '../models/transactionModel.js';
import SavingsAccount from '../models/savingsAccountModel.js';
import { connectDB } from '../config/db.js';

// Connect to database
await connectDB();

// Find all savings accounts
const accounts = await SavingsAccount.find({ status: 'active', balance: { $gt: 0 } }).limit(10);
const User = mongoose.models.User || (await import('../models/userModel.js')).default;
const admin = await User.findOne();

if (!admin) {
  console.error('❌ No admin user found.');
  process.exit(1);
}

console.log(`✅ Found ${accounts.length} active accounts with balance`);
console.log(`✅ Using admin: ${admin.email}`);

// Sample transactions to create
const transactions = [];
for (const account of accounts) {
  // Calculate starting balance (70% of current balance to leave room for deposits)
  const startingBalance = Math.floor(account.balance * 0.7);
  let runningBalance = startingBalance;
  
  // Create deposits in chronological order (oldest first)
  for (let i = 0; i < 3; i++) {
    const amount = Math.floor(Math.random() * 30000) + 5000;
    const balanceBefore = runningBalance;
    runningBalance += amount;
    
    if (runningBalance <= account.balance) {
      const deposit = new Transaction({
        accountId: account._id,
        customerId: account.customerId,
        type: 'deposit',
        amount: amount,
        balanceBefore: balanceBefore,
        balanceAfter: runningBalance,
        description: `Deposit transaction ${i + 1}`,
        reference: `DEP${Date.now()}${i}`,
        processedBy: admin._id,
        deviceId: 'web-admin',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Admin Tool',
        status: 'completed',
        createdAt: new Date(Date.now() - ((i + 1) * 86400000 * 3)) // Spread over 9 days ago
      });
      transactions.push(deposit);
    }
  }

  // Now runningBalance should be close to current balance, create withdrawals
  const finalBalance = account.balance;
  
  // Create some withdrawals (more recent)
  for (let i = 0; i < 2; i++) {
    const amount = Math.floor(Math.random() * Math.min(20000, finalBalance * 0.3)) + 2000;
    if (finalBalance > amount) {
      const withdrawal = new Transaction({
        accountId: account._id,
        customerId: account.customerId,
        type: 'withdrawal',
        amount: amount,
        balanceBefore: finalBalance,
        balanceAfter: finalBalance - amount,
        description: `Withdrawal transaction ${i + 1}`,
        reference: `WDL${Date.now()}${i}`,
        processedBy: admin._id,
        deviceId: 'web-admin',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Admin Tool',
        status: 'completed',
        createdAt: new Date(Date.now() - (i * 86400000)) // Recent transactions
      });
      transactions.push(withdrawal);
    }
  }
}

async function seedTransactions() {
  try {
    console.log('🌱 Starting to seed transactions...\n');

    // Generate transaction IDs
    for (const transaction of transactions) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      transaction.transactionId = `TXN${timestamp}${random}`;
    }

    // Insert transactions
    const result = await Transaction.insertMany(transactions);
    console.log(`✅ Successfully created ${result.length} transactions!`);

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTransactions();

