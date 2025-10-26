import Notification from "../models/notificationModel.js";
import Customer from "../models/customerModel.js";
import SavingsAccount from "../models/savingsAccountModel.js";
import { logActivity } from "../utils/logActivity.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendSMS } from "../utils/sendSMS.js";

// Helper function to replace placeholders in message
const replacePlaceholders = (message, customer, savingsAccount = null) => {
  let processedMessage = message;
  
  // Replace customer placeholders
  if (customer) {
    processedMessage = processedMessage.replace(/{customerName}/g, customer.personalInfo?.fullName || "Customer");
    // Use company phone number instead of customer phone
    processedMessage = processedMessage.replace(/{phone}/g, "+250 78 831 722");
  }
  
  // Replace savings account placeholders
  if (savingsAccount) {
    const accountData = {
      accountNumber: savingsAccount.accountNumber || "N/A",
      balance: savingsAccount.balance?.toLocaleString() || "0",
      accountType: savingsAccount.accountType || "regular",
      interestRate: savingsAccount.interestRate || 0,
      status: savingsAccount.status || "active"
    };
    
    Object.keys(accountData).forEach(key => {
      const value = accountData[key] || "";
      processedMessage = processedMessage.replace(new RegExp(`{${key}}`, 'g'), value);
    });
  }
  
  return processedMessage;
};

// ✅ Create and send notification
const sendNotification = async (req, res) => {
  try {
    const { customerId, types, message, purpose, accountId } = req.body;

    if (!customerId || !Array.isArray(types) || !message) {
      return res.status(400).json({ success: false, message: "Missing or invalid fields" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Get savings account data if accountId is provided
    let savingsAccount = null;
    if (accountId) {
      savingsAccount = await SavingsAccount.findById(accountId);
    } else {
      // Try to find the customer's savings account
      savingsAccount = await SavingsAccount.findOne({ customerId: customerId });
    }

    // Process message to replace any remaining placeholders
    const processedMessage = replacePlaceholders(message, customer, savingsAccount);
    console.log("Original message:", message);
    console.log("Processed message:", processedMessage);

    // 🔔 Send Email
    if (types.includes("email") && customer.contact?.email) {
      try {
        console.log(`📧 Sending email to: ${customer.contact.email}`);
        await sendEmail(
          customer.contact.email,
          `Credit Jambo - ${purpose?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Update"}`,
          processedMessage,
          purpose
        );
        console.log(`✅ Email sent successfully to: ${customer.contact.email}`);
      } catch (emailError) {
        console.error("❌ Email sending failed:", {
          customer: customer.personalInfo?.fullName,
          email: customer.contact.email,
          error: emailError.message
        });
      }
    }

    // 📱 Send SMS
    let smsSuccess = false;
    let smsError = null;
    let smsTrialMode = false;
    
    if (types.includes("sms") && customer.contact?.phone) {
      try {
        console.log(`📱 Sending SMS to: ${customer.contact.phone}`);
        const smsResult = await sendSMS(customer.contact.phone, processedMessage);
        
        if (smsResult.trialMode) {
          console.log(`⚠️ SMS simulated (trial account): ${customer.contact.phone}`, smsResult);
          smsSuccess = true;
          smsTrialMode = true;
        } else {
          console.log(`✅ SMS sent successfully to: ${customer.contact.phone}`, smsResult);
          smsSuccess = true;
        }
      } catch (smsError) {
        console.error("❌ SMS sending failed:", {
          customer: customer.personalInfo?.fullName,
          phone: customer.contact.phone,
          error: smsError.message,
          isTrialAccountError: smsError.isTrialAccountError
        });
        
        // If it's a trial account error, provide helpful message
        if (smsError.isTrialAccountError) {
          smsError = new Error(`SMS not sent: Phone number ${customer.contact.phone} is not verified for Twilio trial account. Please verify the number at twilio.com or upgrade to a paid account.`);
        }
      }
    }

    // 📝 Save Notification to DB
    console.log("Creating notification with data:", {
      customer: customerId,
      type: types,
      purpose: purpose || "custom",
      message: message.substring(0, 100) + "...",
      accountId: accountId || null,
      createdBy: req.user._id,
    });
    
    const newNotification = await Notification.create({
      customer: customerId,
      type: types,
      purpose: purpose || "custom",
      message: processedMessage,
      accountId: accountId || null,
      createdBy: req.user._id,
    });
    
    console.log("Notification created successfully:", newNotification._id);

    // 🗂️ Log Activity
    await logActivity({
      userId: req.user._id,
      action: "notification_sent",
      entityType: "Notification",
      entityId: newNotification._id,
      details: {
        customer: customer.personalInfo?.fullName,
        types: types,
        purpose: purpose,
        emailSent: types.includes("email") && customer.contact?.email,
        smsSent: smsSuccess,
        smsTrialMode: smsTrialMode
      }
    });

    res.json({
      success: true,
      message: "Notification sent successfully!",
      data: {
        notificationId: newNotification._id,
        customer: customer.personalInfo?.fullName,
        emailSent: types.includes("email") && customer.contact?.email,
        smsSent: smsSuccess,
        smsTrialMode: smsTrialMode
      }
    });
  } catch (error) {
    console.error("Send Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message
    });
  }
};

// ✅ Bulk send notifications to multiple customers
const sendBulkNotification = async (req, res) => {
  try {
    const { customerIds, types, message, purpose, accountSpecific } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer IDs array is required and cannot be empty" 
      });
    }

    if (!Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Notification types array is required" 
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
    }

    console.log(`🚀 Starting bulk notification to ${customerIds.length} customers`);

    const results = [];
    const errors = [];
    let totalSent = 0;

    // Process each customer
    for (const customerId of customerIds) {
      try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
          errors.push({
            customerId,
            error: "Customer not found"
          });
          continue;
        }

        // Get savings account data if account-specific mode is enabled
        let savingsAccount = null;
        if (accountSpecific) {
          savingsAccount = await SavingsAccount.findOne({ customerId: customerId });
        }

        // Process message with placeholders
        const processedMessage = replacePlaceholders(message, customer, savingsAccount);

        // Send Email
        let emailSent = false;
        if (types.includes("email") && customer.contact?.email) {
          try {
            await sendEmail(
              customer.contact.email,
              `Credit Jambo - ${purpose?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Update"}`,
              processedMessage,
              purpose
            );
            emailSent = true;
          } catch (emailError) {
            console.error(`❌ Email failed for ${customer.personalInfo?.fullName}:`, emailError.message);
          }
        }

        // Send SMS
        let smsSent = false;
        let smsTrialMode = false;
        if (types.includes("sms") && customer.contact?.phone) {
          try {
            const smsResult = await sendSMS(customer.contact.phone, processedMessage);
            smsSent = true;
            if (smsResult.trialMode) {
              smsTrialMode = true;
            }
          } catch (smsError) {
            console.error(`❌ SMS failed for ${customer.personalInfo?.fullName}:`, smsError.message);
          }
        }

        // Save notification to database
        const newNotification = await Notification.create({
          customer: customerId,
          type: types,
          purpose: purpose || "custom",
          message: processedMessage,
          accountId: savingsAccount?._id || null,
          createdBy: req.user._id,
        });

        // Log individual notification activity
        await logActivity({
          userId: req.user._id,
          action: "bulk_notification_sent",
          entityType: "Notification",
          entityId: newNotification._id,
          details: {
            customer: customer.personalInfo?.fullName,
            types: types,
            purpose: purpose,
            emailSent,
            smsSent,
            smsTrialMode,
            bulkOperation: true
          }
        });

        results.push({
          customerId,
          customerName: customer.personalInfo?.fullName,
          success: true,
          emailSent,
          smsSent,
          smsTrialMode,
          notificationId: newNotification._id
        });

        totalSent++;

      } catch (error) {
        console.error(`❌ Error processing customer ${customerId}:`, error);
        errors.push({
          customerId,
          error: error.message
        });
      }
    }

    // Log bulk operation activity
    await logActivity({
      userId: req.user._id,
      action: "bulk_notification_completed",
      entityType: "Notification",
      details: {
        totalCustomers: customerIds.length,
        successful: totalSent,
        failed: errors.length,
        types: types,
        purpose: purpose
      }
    });

    console.log(`✅ Bulk notification completed: ${totalSent} successful, ${errors.length} failed`);

    res.json({
      success: true,
      message: `Bulk notification completed! ${totalSent} notifications sent successfully, ${errors.length} failed.`,
      data: {
        summary: {
          total: customerIds.length,
          successful: totalSent,
          failed: errors.length
        },
        results,
        errors
      }
    });

  } catch (error) {
    console.error("Bulk Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send bulk notifications",
      error: error.message
    });
  }
};

// ✅ List all notifications (optionally filtered by customer)
const listNotifications = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customerId) {
      filter.customer = req.query.customerId;
    }

    console.log("Fetching notifications with filter:", filter);
    
    const notifications = await Notification.find(filter)
      .populate("customer", "personalInfo.fullName customerCode contact.email contact.phone")
      .populate("createdBy", "fullName")
      .populate("accountId", "accountNumber balance accountType")
      .sort("-createdAt");

    console.log("Found notifications:", notifications.length);
    console.log("First notification:", notifications[0]);

    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("Fetch Notification List Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// ✅ View a single notification by ID
const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate("customer", "personalInfo.fullName customerCode contact.email contact.phone")
      .populate("createdBy", "fullName")
      .populate("accountId", "accountNumber balance accountType");

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    console.error("Fetch Single Notification Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch notification" });
  }
};

// ✅ Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    await Notification.findByIdAndDelete(req.params.id);

    // Log the deletion
    await logActivity({
      userId: req.user._id,
      action: "notification_deleted",
      entityType: "Notification",
      entityId: req.params.id,
      details: {
        customer: notification.customer,
        purpose: notification.purpose
      }
    });

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Delete Notification Error:", err);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

export {
  sendNotification,
  sendBulkNotification,
  listNotifications,
  getNotificationById,
  deleteNotification
};
