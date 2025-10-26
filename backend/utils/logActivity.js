import Activity from '../models/activityModel.js';
import mongoose from 'mongoose';

export const logActivity = async ({ userId, action, entityType, entityId, details = {} }) => {
  try {
    // Handle system user ID conversion
    let validUserId = userId;
    if (userId === 'system') {
      // Use a default system ObjectId or create one
      validUserId = new mongoose.Types.ObjectId('000000000000000000000001');
    } else if (userId && typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
      validUserId = new mongoose.Types.ObjectId(userId);
    } else if (userId && typeof userId === 'string') {
      // If it's not a valid ObjectId string, skip logging this activity
      console.warn(`⚠️ Skipping activity log for invalid userId: ${userId}`);
      return;
    }

    // Handle entityId conversion for non-ObjectId values
    let validEntityId = entityId;
    if (entityId && typeof entityId === 'string') {
      if (mongoose.Types.ObjectId.isValid(entityId)) {
        validEntityId = new mongoose.Types.ObjectId(entityId);
      } else {
        // For non-ObjectId strings like 'bulk_fix', store as string in details
        details.originalEntityId = entityId;
        validEntityId = null;
      }
    }

    const activity = new Activity({
      user: validUserId || null,
      action,
      entityType,
      entityId: validEntityId,
      details
    });
    
    const savedActivity = await activity.save();
    console.log(`📝 Activity logged: ${action} for ${entityType} ${entityId || 'N/A'}`);
    return savedActivity;
  } catch (error) {
    console.error("❌ Error logging activity:", {
      action,
      entityType,
      entityId,
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error; // Re-throw to allow calling code to handle
  }
};
