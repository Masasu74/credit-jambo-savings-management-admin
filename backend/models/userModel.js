import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { type: String, required: true, minlength: 8, select: false },
  role: {
    type: String,
    enum: ['admin', 'manager', 'branch-manager', 'loan-officer', 'collections-officer', 'accountant', 'hr-officer', 'reporting', 'support', 'auditor'],
    default: 'accountant'
  },
  // branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // Removed for savings management system
  profilePicture: { type: String, default: null },
  phoneNumber: { type: String, trim: true },
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  firstLogin: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add database indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
// userSchema.index({ branch: 1, role: 1 }); // Removed for savings management system
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
