import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    assistantName: {
      type: String,
      default: "",
      trim: true,
    },

    assistantImage: {
      type: String,
      default: "",
    },

    // ==========================================
    // CONVERSATION HISTORY
    // ==========================================

    conversationHistory: {
      type: [
        {
          user: {
            type: String,
            default: "",
          },

          assistant: {
            type: String,
            default: "",
          },

          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      default: [],
    },

    // ==========================================
    // ACTIVE LIST
    // ==========================================

    activeList: {
      title: {
        type: String,
        default: "",
      },

      items: {
        type: [
          {
            number: {
              type: Number,
              default: 0,
            },

            title: {
              type: String,
              default: "",
            },

            description: {
              type: String,
              default: "",
            },

            searchQuery: {
              type: String,
              default: "",
            },

            image: {
              type: String,
              default: "",
            },

            thumbnail: {
              type: String,
              default: "",
            },

            contextLink: {
              type: String,
              default: "",
            },

            source: {
              type: String,
              default: "",
            },

            url: {
              type: String,
              default: "",
            },
          },
        ],

        default: [],
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;