import mongoose from "mongoose";

export type VentureStatus = "New" | "Evaluation" | "Review" | "Active" | "Closed";

const VentureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    founderName: { type: String, required: true, trim: true },
    founderEmail: { type: String, required: true, trim: true },
    industry: { type: String, required: true },
    status: { type: String, required: true, enum: ["New","Evaluation","Review","Active","Closed"] },
    followUpDate: { type: Date, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Venture = mongoose.model("Venture", VentureSchema);
