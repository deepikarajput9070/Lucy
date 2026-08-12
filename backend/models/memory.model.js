import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userMessage: {
      type: String,
      required: true,
    },

    assistantMessage: {
      type: String,
      required: true,
    },

    intent: {
      type: String,
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;