import mongoose from "mongoose";

const FollowUpSchema = new mongoose.Schema(
  {
    ventureId: { type: mongoose.Schema.Types.ObjectId, ref: "Venture", required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["pending","completed","overdue"], default: "pending" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const FollowUp = mongoose.model("FollowUp", FollowUpSchema);
