const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: null },

    // ✅ New fields
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    tags: [{ type: String }],

    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", ArticleSchema);
