import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    ventureId: { type: mongoose.Schema.Types.ObjectId, ref: "Venture", default: null },
    ventureName: { type: String, default: "" },
    action: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Activity = mongoose.model("Activity", ActivitySchema);
