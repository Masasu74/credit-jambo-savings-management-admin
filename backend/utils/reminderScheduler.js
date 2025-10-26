// utils/reminderScheduler.js
import cron from "node-cron";
import SavingsAccount from "../models/savingsAccountModel.js";
import Customer from "../models/customerModel.js";
// import { sendEmail } from "./sendEmail.js";

export const startReminderScheduler = () => {
  // Daily low balance check at 9AM
  cron.schedule("0 9 * * *", async () => {
    console.log("Running daily low balance check...");

    try {
      const lowBalanceAccounts = await SavingsAccount.getLowBalanceAccounts(1000); // Accounts with less than 1000 RWF

      for (const account of lowBalanceAccounts) {
        const customer = account.customerId;
        if (!customer || !customer.contact?.email) continue;

        const message = `
          Hello ${customer.personalInfo?.fullName},

          This is a friendly reminder:
          Your savings account (${account.accountNumber}) has a low balance of Frw ${account.balance.toLocaleString()}.

          Consider making a deposit to maintain a healthy savings balance.

          Regards,
          Credit Jambo Team
        `;

        // Uncomment when email service is available
        // await sendEmail({
        //   to: customer.contact.email,
        //   subject: "Low Balance Alert - Savings Account",
        //   text: message
        // });

        console.log(`✅ Low balance alert prepared for ${customer.contact.email} - Account: ${account.accountNumber}`);
      }

      console.log(`✅ Low balance check completed. Found ${lowBalanceAccounts.length} accounts with low balance.`);
    } catch (error) {
      console.error("Error in low balance check:", error);
    }
  });

  // Weekly savings summary at 10AM every Monday
  cron.schedule("0 10 * * 1", async () => {
    console.log("Running weekly savings summary...");

    try {
      const activeAccounts = await SavingsAccount.find({ 
        status: 'active',
        isVerified: true 
      }).populate('customerId', 'personalInfo contact');

      for (const account of activeAccounts) {
        const customer = account.customerId;
        if (!customer || !customer.contact?.email) continue;

        const message = `
          Hello ${customer.personalInfo?.fullName},

          Weekly Savings Summary:
          Account: ${account.accountNumber}
          Current Balance: Frw ${account.balance.toLocaleString()}
          Account Type: ${account.accountType}
          Interest Rate: ${account.interestRate}% per annum

          Keep up the great savings habit!

          Regards,
          Credit Jambo Team
        `;

        // Uncomment when email service is available
        // await sendEmail({
        //   to: customer.contact.email,
        //   subject: "Weekly Savings Summary",
        //   text: message
        // });

        console.log(`✅ Weekly summary prepared for ${customer.contact.email} - Account: ${account.accountNumber}`);
      }

      console.log(`✅ Weekly savings summary completed. Processed ${activeAccounts.length} accounts.`);
    } catch (error) {
      console.error("Error in weekly savings summary:", error);
    }
  });
};
