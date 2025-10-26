import InAppNotification from '../models/inAppNotificationModel.js';
import User from '../models/userModel.js';
import { logActivity } from './logActivity.js';

/**
 * Send attendance notification to managers and branch managers
 * @param {Object} params
 * @param {String} params.employeeId - ID of the employee who clocked in/out
 * @param {String} params.employeeName - Name of the employee
 * @param {String} params.action - 'clock_in' or 'clock_out'
 * @param {String} params.time - Time of the action
 * @param {String} params.location - Location of the action
 * @param {String} params.branchId - Branch ID of the employee (optional)
 */
export const sendAttendanceNotification = async ({
  employeeId,
  employeeName,
  action,
  time,
  location,
  branchId
}) => {
  try {
    // Determine notification content based on action
    const isClockIn = action === 'clock_in';
    const actionText = isClockIn ? 'clocked in' : 'clocked out';
    const title = `Employee ${actionText}`;
    const message = `${employeeName} has ${actionText} at ${time}${location ? ` from ${location}` : ''}.`;

    // Find managers and branch managers to notify
    const targetUsers = [];
    
    // Get all managers and branch managers
    const managers = await User.find({
      role: { $in: ['manager', 'branch-manager'] },
      isActive: true
    }).select('_id role branch');

    // Filter based on branch if employee has a branch
    if (branchId) {
      // Notify branch managers of the same branch
      const branchManagers = managers.filter(user => 
        user.role === 'branch-manager' && 
        user.branch && 
        user.branch.toString() === branchId.toString()
      );
      targetUsers.push(...branchManagers.map(u => u._id));
    }

    // Always notify general managers (role: 'manager')
    const generalManagers = managers.filter(user => user.role === 'manager');
    targetUsers.push(...generalManagers.map(u => u._id));

    // Remove duplicates
    const uniqueTargetUsers = [...new Set(targetUsers.map(id => id.toString()))];

    if (uniqueTargetUsers.length === 0) {
      console.log('No managers or branch managers found to notify');
      return;
    }

    // Create notification
    const notification = new InAppNotification({
      title,
      message,
      type: 'attendance_alert',
      priority: 'medium',
      targetUsers: uniqueTargetUsers,
      targetBranches: branchId ? [branchId] : [],
      relatedUser: employeeId,
      actionUrl: `/attendance/records`,
      actionText: 'View Attendance',
      createdBy: employeeId // The employee who triggered the notification
    });

    await notification.save();

    // Log the notification creation
    await logActivity({
      userId: employeeId,
      action: `attendance_notification_sent_${action}`,
      entityType: 'notification',
      entityId: notification._id,
      details: {
        targetUsers: uniqueTargetUsers.length,
        action,
        employeeName,
        time,
        location
      }
    });

    console.log(`Attendance notification sent to ${uniqueTargetUsers.length} managers/branch managers for ${action}`);

    return notification;

  } catch (error) {
    console.error('Error sending attendance notification:', error);
    // Don't throw error to avoid breaking the main attendance flow
  }
};

/**
 * Send clock in notification
 */
export const sendClockInNotification = async (employeeId, employeeName, time, location, branchId) => {
  return sendAttendanceNotification({
    employeeId,
    employeeName,
    action: 'clock_in',
    time,
    location,
    branchId
  });
};

/**
 * Send clock out notification
 */
export const sendClockOutNotification = async (employeeId, employeeName, time, location, branchId) => {
  return sendAttendanceNotification({
    employeeId,
    employeeName,
    action: 'clock_out',
    time,
    location,
    branchId
  });
};
