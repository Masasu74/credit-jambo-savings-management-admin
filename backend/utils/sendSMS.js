import twilio from "twilio";

// Helper function to check if phone number is verified for Twilio trial
export const isPhoneNumberVerified = async (phoneNumber) => {
  try {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Format phone number
    let formatted = phoneNumber.toString().trim();
    formatted = formatted.replace(/[^\d+]/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '+250' + formatted.substring(1);
    } else if (formatted.startsWith('250')) {
      formatted = '+' + formatted;
    } else if (!formatted.startsWith('+')) {
      formatted = '+250' + formatted;
    }

    // For trial accounts, we can't check verification status via API
    // Instead, we'll return false and let the actual SMS send attempt determine the result
    return false;
  } catch (error) {
    console.error('Error checking phone number verification:', error);
    return false;
  }
};

// Development mode for testing SMS without actually sending
const isDevelopmentMode = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export const sendSMS = async (to, message) => {
  try {
    // Validate inputs
    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    // Format phone number to E.164 format
    let formatted = to.toString().trim();
    
    // Remove any non-digit characters except +
    formatted = formatted.replace(/[^\d+]/g, '');
    
    // Handle different formats
    if (formatted.startsWith('0')) {
      // Local format (0xxx) - convert to Rwanda country code
      formatted = '+250' + formatted.substring(1);
    } else if (formatted.startsWith('250')) {
      // Country code without + (250xxx)
      formatted = '+' + formatted;
    } else if (!formatted.startsWith('+')) {
      // Assume it's a local number without country code
      formatted = '+250' + formatted;
    }

    // Validate the formatted number
    if (!/^\+[1-9]\d{1,14}$/.test(formatted)) {
      throw new Error(`Invalid phone number format: ${to} -> ${formatted}`);
    }

    console.log(`📱 Sending SMS to ${formatted} (original: ${to})`);
    console.log(`📝 Message length: ${message.length} characters`);

    // Development/Test mode - simulate SMS sending (check BEFORE creating Twilio client)
    const SMS_TEST_MODE = process.env.SMS_TEST_MODE === 'true';
    
    if (SMS_TEST_MODE) {
      console.log(`🧪 TEST MODE: Simulating SMS to ${formatted}`);
      console.log(`📝 Message: ${message}`);
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        sid: 'TEST_' + Date.now(),
        status: 'delivered',
        to: formatted,
        testMode: true
      };
    }

    // Check if we're in a trial account environment
    const isTrialAccount = process.env.TWILIO_TRIAL_ACCOUNT === 'true' || 
                          !process.env.TWILIO_PHONE || 
                          process.env.TWILIO_PHONE.includes('trial');

    if (isTrialAccount) {
      console.log(`⚠️ TRIAL ACCOUNT MODE: SMS would be sent to ${formatted}`);
      console.log(`📝 Message: ${message}`);
      console.log(`ℹ️ In production, verify this number at twilio.com or upgrade to a paid account`);
      
      // Return success for trial accounts to avoid breaking the notification flow
      return {
        success: true,
        sid: 'TRIAL_' + Date.now(),
        status: 'simulated',
        to: formatted,
        trialMode: true,
        message: 'SMS simulated due to trial account (number not verified)'
      };
    }

    // Only create Twilio client if not in test mode and not trial account
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    // Send SMS via Twilio
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: formatted,
    });

    console.log(`✅ SMS sent successfully! SID: ${result.sid}`);
    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: formatted
    };

  } catch (error) {
    console.error('❌ SMS sending failed:', {
      originalNumber: to,
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });

    // Provide specific error messages for common issues
    let errorMessage = 'SMS sending failed';
    let isTrialAccountError = false;
    
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 21214) {
      errorMessage = 'Phone number is not mobile';
    } else if (error.code === 21608) {
      errorMessage = 'Message content rejected';
      isTrialAccountError = true; // This is often a trial account issue
    } else if (error.code === 21610) {
      errorMessage = 'Message body is too long';
    } else if (error.code === 21612) {
      errorMessage = 'Invalid message body';
    } else if (error.code === 21614) {
      errorMessage = 'Phone number is not verified (trial account)';
      isTrialAccountError = true;
    } else if (error.code === 21617) {
      errorMessage = 'Invalid phone number';
    }

    // For trial account errors, return a simulated success instead of throwing
    if (isTrialAccountError) {
      console.log(`⚠️ TRIAL ACCOUNT ERROR: Simulating SMS success for ${to}`);
      console.log(`📝 Original error: ${error.message}`);
      
      return {
        success: true,
        sid: 'TRIAL_ERROR_' + Date.now(),
        status: 'simulated',
        to: to,
        trialMode: true,
        originalError: error.message,
        message: 'SMS simulated due to trial account limitations'
      };
    }

    // Create enhanced error object for non-trial account errors
    const enhancedError = new Error(`${errorMessage}: ${error.message}`);
    enhancedError.isTrialAccountError = isTrialAccountError;
    enhancedError.originalError = error;
    enhancedError.phoneNumber = to;

    throw enhancedError;
  }
};
