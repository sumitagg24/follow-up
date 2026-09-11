import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    ventureId: { type: mongoose.Schema.Types.ObjectId, ref: "Venture", default: null },
    ventureName: { type: String, default: "" },
    action: { type: String, required: true },
    description: { type: String, required: true },
    // Optional structured payload (e.g. automation run summary)
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Every feed/history query sorts newest-first by createdAt …
ActivitySchema.index({ createdAt: -1 });
// … and the reminder-dedupe check plus venture activity lookups filter by
// venture + action.
ActivitySchema.index({ ventureId: 1, action: 1 });

export const Activity = mongoose.model("Activity", ActivitySchema);
