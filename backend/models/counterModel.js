import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  type: { type: String, required: true },          // e.g., "customer"
  branchCode: { type: String, required: true },     // ✅ changed from branchAlias
  prefix: { type: String, required: true },         // e.g., "CUST"
  seq: { type: Number, default: 0 }
});

counterSchema.index({ type: 1, branchCode: 1, prefix: 1 }, { unique: true });

export default mongoose.models.Counter || mongoose.model("Counter", counterSchema);
