import User from "../models/userModel.js";
import Session from "../models/sessionModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { logActivity } from "../utils/logActivity.js";
import { clearEntityCache } from "../middleware/cache.js";
import EnhancedAuditLogger from "../utils/enhancedAuditLogger.js";
import { createUserNotification } from "../utils/notificationHelper.js";
import { v4 as uuidv4 } from 'uuid';
import QueryOptimizer from "../utils/queryOptimizer.js";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Helper functions for device detection
const getBrowserInfo = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const getOSInfo = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

const getDeviceInfo = (userAgent) => {
  if (!userAgent) return 'desktop';
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet')) return 'tablet';
  return 'desktop';
};

const registerUser = async (req, res) => {
  const { fullName, email, password, role, branch } = req.body;

  try {
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const currentUser = req.user;
    if (["admin", "manager"].includes(role) && currentUser?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can assign this role" });
    }

    if (role === "branch-manager" && !branch) {
      return res.status(400).json({ success: false, message: "Branch is required for branch-manager" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const newUser = new User({ fullName, email, password, role, branch });
    await newUser.save();

    await logActivity({
      userId: newUser._id,
      action: "user_registered",
      entityType: "user",
      entityId: newUser._id,
      details: { email, fullName, role, branch }
    });

    // Create notification for new user
    await createUserNotification('added', newUser, currentUser);

    // Clear user cache to ensure fresh data is fetched
    clearEntityCache('user');

    const token = createToken(newUser._id);
    res.status(201).json({ 
      success: true, 
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        branch: newUser.branch
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Error Registering User" });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account is disabled. Contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Create session ID
    const sessionId = uuidv4();
    
    // Create MongoDB session record
    const session = new Session({
      user: user._id,
      sessionId,
      token: createToken(user._id),
      loginInfo: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        deviceInfo: {
          browser: getBrowserInfo(req.get('User-Agent')),
          os: getOSInfo(req.get('User-Agent')),
          device: getDeviceInfo(req.get('User-Agent'))
        }
      }
    });
    
    await session.save();
    
    // Enhanced audit logging
    await EnhancedAuditLogger.logUserLogin({
      userId: user._id,
      sessionId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: true
    });

    // Also log to legacy system for backward compatibility
    await logActivity({
      userId: user._id,
      action: "user_logged_in",
      entityType: "user",
      entityId: user._id,
      details: { email }
    });

    const token = createToken(user._id);
    res.status(200).json({
      success: true,
      token,
      sessionId,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        branch: user.branch || null
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Login Error" });
  }
};


const listUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "branch-manager") {
      query.branch = req.user.branch;
    }

    // Fetch ALL users - client wants complete data
    const users = await User.find(query)
      .select("-password");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("List Error:", error);
    res.status(500).json({ success: false, message: "Error Fetching Users" });
  }
};

// List only Responsible Officers (loan-officer, collections-officer)
const listResponsibleOfficers = async (req, res) => {
  try {
    const roleFilter = { $in: ["loan-officer", "collections-officer"] };
    const query = { role: roleFilter, isActive: true };

    // Branch managers see only their branch staff
    if (req.user.role === "branch-manager" && req.user.branch) {
      query.branch = req.user.branch;
    }

    const users = await User.find(query)
      .select("_id fullName role email branch");

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("List Responsible Officers Error:", error);
    res.status(500).json({ success: false, message: "Error Fetching Responsible Officers" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullName, email, role, branch, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (role && ["admin", "manager"].includes(role) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can assign this role" });
    }

    user.fullName = fullName ?? user.fullName;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.branch = branch ?? user.branch;
    user.isActive = typeof isActive === "boolean" ? isActive : user.isActive;

    await user.save();

    await logActivity({
      userId: req.user._id,
      action: "user_updated",
      entityType: "user",
      entityId: user._id,
      details: { fullName, email, role, branch, isActive }
    });

    // Clear user cache to ensure fresh data is fetched
    clearEntityCache('user');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, currentPassword, newPassword } = req.body;
    
    // Get Cloudinary upload result
    const cloudinaryResults = req.cloudinaryResults || [];
    const profilePicture = cloudinaryResults.length > 0 ? cloudinaryResults[0].url : null;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update basic info
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profilePicture) user.profilePicture = profilePicture;

    // Handle password change
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
      }
      user.password = newPassword;
      
      // Mark first login as completed
      if (user.firstLogin) {
        user.firstLogin = false;
      }
    }

    await user.save();

    await logActivity({
      userId: user._id,
      action: "profile_updated",
      entityType: "user",
      entityId: user._id,
      details: { fullName, phoneNumber, passwordChanged: !!newPassword, firstLoginCompleted: user.firstLogin === false }
    });

    // Clear user cache
    clearEntityCache('user');

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, user: userResponse });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ success: false, message: "Profile update failed" });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Check if user has a profile picture
    if (!user.profilePicture) {
      return res.status(400).json({ success: false, message: "No profile picture to delete" });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (user.profilePicture.includes('cloudinary.com')) {
      try {
        const cloudinaryService = (await import('../services/cloudinaryService.js')).default;
        // Extract public ID from Cloudinary URL
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinaryService.deleteFile(publicId);
        console.log(`✅ Profile picture deleted from Cloudinary: ${publicId}`);
      } catch (cloudinaryError) {
        console.error(`❌ Failed to delete profile picture from Cloudinary: ${cloudinaryError.message}`);
        // Continue with database update even if Cloudinary deletion fails
      }
    }

    // Remove profile picture from user record
    user.profilePicture = null;
    await user.save();

    await logActivity({
      userId: user._id,
      action: "profile_picture_deleted",
      entityType: "user",
      entityId: user._id,
      details: { deletedBy: user.email }
    });

    // Clear user cache
    clearEntityCache('user');

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      success: true, 
      message: "Profile picture deleted successfully",
      user: userResponse 
    });
  } catch (error) {
    console.error("Delete Profile Picture Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete profile picture" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await User.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user._id,
      action: "user_deleted",
      entityType: "user",
      entityId: req.params.id,
      details: { deletedBy: req.user.email }
    });

    // Clear user cache to ensure fresh data is fetched
    clearEntityCache('user');

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Deletion failed" });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Terminate MongoDB session if sessionId is provided
    if (sessionId) {
      const session = await Session.findOne({ sessionId });
      if (session) {
        session.status = 'terminated';
        session.logoutInfo = {
          timestamp: new Date(),
          reason: 'user_logout',
          ipAddress: req.ip || req.connection.remoteAddress
        };
        session.duration = session.logoutInfo.timestamp - session.loginInfo.timestamp;
        await session.save();
      }
    }

    // Enhanced audit logging
    await EnhancedAuditLogger.logUserLogout({
      userId: req.user._id,
      sessionId,
      reason: 'user_logout'
    });

    // Also log to legacy system for backward compatibility
    await logActivity({
      userId: req.user._id,
      action: "user_logged_out",
      entityType: "user",
      entityId: req.user._id,
      details: { sessionId }
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { userId } = req.params;
    const currentUser = req.user;

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Role-based authorization
    if (currentUser.role === "manager") {
      // Manager can change any password except admin passwords
      if (targetUser.role === "admin") {
        return res.status(403).json({ success: false, message: "Managers cannot change admin passwords" });
      }
    } else if (currentUser.role === "admin") {
      // Admin can change any password
      // No restrictions
    } else {
      // Other roles cannot change passwords
      return res.status(403).json({ success: false, message: "You don't have permission to change user passwords" });
    }

    // Update the password
    targetUser.password = newPassword;
    
    // Mark first login as completed if it was true
    if (targetUser.firstLogin) {
      targetUser.firstLogin = false;
    }

    await targetUser.save();

    // Log the activity
    await logActivity({
      userId: currentUser._id,
      action: "password_changed_by_admin",
      entityType: "user",
      entityId: targetUser._id,
      details: { 
        changedBy: currentUser.email,
        changedFor: targetUser.email,
        targetRole: targetUser.role,
        firstLoginReset: targetUser.firstLogin === false
      }
    });

    // Clear user cache
    clearEntityCache('user');

    res.status(200).json({ 
      success: true, 
      message: `Password changed successfully for ${targetUser.fullName}` 
    });
  } catch (error) {
    console.error("Password Change Error:", error);
    res.status(500).json({ success: false, message: "Password change failed" });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  listUsers,
  getCurrentUser,
  updateUser,
  updateProfile,
  deleteProfilePicture,
  deleteUser,
  listResponsibleOfficers,
  changeUserPassword
};
