const mongoose = require("mongoose");

const refeshToken = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

refeshToken.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefeshToken", refeshToken);
