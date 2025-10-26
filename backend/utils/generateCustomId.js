import Counter from '../models/counterModel.js';
import Customer from '../models/customerModel.js';
import SavingsAccount from '../models/savingsAccountModel.js';

export async function generateCustomId(type, branchCode, prefix) {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const counter = await Counter.findOneAndUpdate(
      { type, branchCode, prefix },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    
    const padded = counter.seq.toString().padStart(3, '0');
    const generatedId = `${prefix}-${branchCode}-${padded}`;

    // Check if this ID already exists in the database
    let exists = false;
    
    if (type === 'customer') {
      exists = await Customer.exists({ customerCode: generatedId });
    } else if (type === 'savings-account') {
      exists = await SavingsAccount.exists({ accountNumber: generatedId });
    }

    // If the ID doesn't exist, return it
    if (!exists) {
      return generatedId;
    }

    // If it exists, log a warning and continue to the next iteration
    console.warn(`⚠️ Generated ID ${generatedId} already exists. Retrying... (Attempt ${attempts + 1}/${maxAttempts})`);
    attempts++;
  }

  // If we've exhausted all attempts, throw an error
  throw new Error(`Failed to generate unique ID after ${maxAttempts} attempts for ${type} with branch ${branchCode}`);
}
