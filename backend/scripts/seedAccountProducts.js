import mongoose from 'mongoose';
import 'dotenv/config.js';
import AccountProduct from '../models/accountProductModel.js';
import Customer from '../models/customerModel.js';
import SavingsAccount from '../models/savingsAccountModel.js';
import { connectDB } from '../config/db.js';

// Connect to database
await connectDB();

// Find first user/admin to use as createdBy
const User = mongoose.models.User || (await import('../models/userModel.js')).default;
const admin = await User.findOne();

if (!admin) {
  console.error('❌ No admin user found. Please create an admin user first.');
  process.exit(1);
}

console.log(`✅ Using admin: ${admin.email}`);

// Sample account products
const products = [
  {
    productCode: 'BASIC_SAV',
    productName: 'Basic Savings',
    description: 'Simple savings account for everyday banking needs',
    accountType: 'regular',
    minimumDeposit: 1000,
    minimumBalance: 0,
    monthlyFee: 0,
    interestRate: 2.5,
    interestFrequency: 'monthly',
    features: ['ATM access', 'Mobile banking', 'Online transfers'],
    eligibility: {
      minAge: 18,
      maxAge: null,
      minSalary: 0
    },
    depositLimits: {
      minDeposit: 1000,
      maxDeposit: null,
      minWithdrawal: 1000,
      maxWithdrawal: null
    },
    displayOrder: 1,
    isActive: true,
    createdBy: admin._id
  },
  {
    productCode: 'PREMIUM_SAV',
    productName: 'Premium Savings',
    description: 'High-yield savings account with premium benefits',
    accountType: 'premium',
    minimumDeposit: 50000,
    minimumBalance: 10000,
    monthlyFee: 500,
    interestRate: 5.0,
    interestFrequency: 'monthly',
    features: ['Priority support', 'Higher ATM limits', 'Mobile banking', 'Online transfers', 'Cheque book'],
    eligibility: {
      minAge: 18,
      maxAge: null,
      minSalary: 500000
    },
    depositLimits: {
      minDeposit: 5000,
      maxDeposit: null,
      minWithdrawal: 5000,
      maxWithdrawal: null
    },
    displayOrder: 2,
    isActive: true,
    createdBy: admin._id
  },
  {
    productCode: 'YOUTH_SAV',
    productName: 'Youth Savings',
    description: 'Special savings account for young customers',
    accountType: 'youth',
    minimumDeposit: 500,
    minimumBalance: 0,
    monthlyFee: 0,
    interestRate: 3.0,
    interestFrequency: 'monthly',
    features: ['Free ATM access', 'Mobile banking', 'Educational resources'],
    eligibility: {
      minAge: 16,
      maxAge: 25,
      minSalary: 0
    },
    depositLimits: {
      minDeposit: 500,
      maxDeposit: 100000,
      minWithdrawal: 500,
      maxWithdrawal: 50000
    },
    displayOrder: 3,
    isActive: true,
    createdBy: admin._id
  },
  {
    productCode: 'SENIOR_SAV',
    productName: 'Senior Savings',
    description: 'Dedicated savings account for senior citizens',
    accountType: 'senior',
    minimumDeposit: 10000,
    minimumBalance: 5000,
    monthlyFee: 0,
    interestRate: 4.5,
    interestFrequency: 'monthly',
    features: ['Higher interest rate', 'Personalized service', 'Mobile banking', 'Free medical consultations'],
    eligibility: {
      minAge: 60,
      maxAge: null,
      minSalary: 0
    },
    depositLimits: {
      minDeposit: 1000,
      maxDeposit: null,
      minWithdrawal: 1000,
      maxWithdrawal: null
    },
    displayOrder: 4,
    isActive: true,
    createdBy: admin._id
  },
  {
    productCode: 'BUSINESS_SAV',
    productName: 'Business Savings',
    description: 'Savings account designed for business needs',
    accountType: 'business',
    minimumDeposit: 100000,
    minimumBalance: 50000,
    monthlyFee: 2000,
    interestRate: 3.5,
    interestFrequency: 'quarterly',
    features: ['Multiple signatories', 'Business online banking', 'Priority support', 'Cheque book', 'Overdraft facility'],
    eligibility: {
      minAge: 18,
      maxAge: null,
      minSalary: 0
    },
    depositLimits: {
      minDeposit: 10000,
      maxDeposit: null,
      minWithdrawal: 10000,
      maxWithdrawal: null
    },
    displayOrder: 5,
    isActive: true,
    createdBy: admin._id
  },
  {
    productCode: 'FIXED_SAV',
    productName: 'Fixed Deposit',
    description: 'Long-term fixed deposit with guaranteed returns',
    accountType: 'fixed',
    minimumDeposit: 25000,
    minimumBalance: 0,
    monthlyFee: 0,
    interestRate: 8.0,
    interestFrequency: 'annually',
    features: ['Guaranteed returns', 'Lock-in period', 'Higher interest rate', 'Flexible tenure'],
    eligibility: {
      minAge: 18,
      maxAge: null,
      minSalary: 0
    },
    depositLimits: {
      minDeposit: 25000,
      maxDeposit: null,
      minWithdrawal: 0,
      maxWithdrawal: 0  // No withdrawals during lock-in period
    },
    displayOrder: 6,
    isActive: true,
    createdBy: admin._id
  }
];

// Seed function
async function seedAccountProducts() {
  try {
    console.log('🌱 Starting to seed account products...\n');

    // Clear existing products (optional - comment out if you want to keep existing data)
    // const deleted = await AccountProduct.deleteMany({});
    // console.log(`🗑️  Deleted ${deleted.deletedCount} existing products`);

    // Insert products
    const createdProducts = [];
    for (const product of products) {
      // Check if product already exists
      const existing = await AccountProduct.findOne({ productCode: product.productCode });
      
      if (existing) {
        console.log(`⚠️  Product ${product.productCode} already exists, skipping...`);
        createdProducts.push(existing);
      } else {
        const newProduct = new AccountProduct(product);
        await newProduct.save();
        console.log(`✅ Created product: ${product.productCode} - ${product.productName}`);
        createdProducts.push(newProduct);
      }
    }

    console.log(`\n✅ Successfully seeded ${createdProducts.length} account products!`);

    // Now create sample savings accounts for existing customers
    console.log('\n🏦 Creating sample savings accounts for existing customers...\n');

    const customers = await Customer.find({ isActive: true }).limit(10);
    console.log(`Found ${customers.length} active customers`);

    if (customers.length > 0 && createdProducts.length > 0) {
      let accountsCreated = 0;
      
      for (let i = 0; i < customers.length && i < 5; i++) {
        const customer = customers[i];
        
        // Check if customer already has accounts
        const existingAccounts = await SavingsAccount.find({ customerId: customer._id });
        
        if (existingAccounts.length === 0) {
          // Assign a product based on customer index
          const product = createdProducts[i % createdProducts.length];
          
          try {
            const account = new SavingsAccount({
              customerId: customer._id,
              productId: product._id,
              productCode: product.productCode,
              accountType: product.accountType,
              minimumBalance: product.minimumBalance,
              interestRate: product.interestRate,
              balance: Math.floor(Math.random() * 500000) + 10000, // Random balance between 10k and 510k
              status: 'active',
              isVerified: true,
              createdBy: admin._id
            });

            await account.save();
            console.log(`✅ Created ${product.productCode} account for customer: ${customer.personalInfo?.fullName || customer.contact?.email || 'Unknown'}`);
            accountsCreated++;
          } catch (error) {
            if (error.code === 11000) {
              console.log(`⚠️  Customer ${customer._id} already has a ${product.productCode} account`);
            } else {
              console.error(`❌ Error creating account: ${error.message}`);
            }
          }
        } else {
          console.log(`⚠️  Customer ${customer._id} already has ${existingAccounts.length} account(s)`);
        }
      }

      console.log(`\n✅ Successfully created ${accountsCreated} sample savings accounts!`);
    } else {
      console.log('⚠️  No customers or products available to create sample accounts');
    }

    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAccountProducts();

