import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    ventureId: { type: mongoose.Schema.Types.ObjectId, ref: "Venture", required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["pending","completed"], default: "pending" },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", TaskSchema);
