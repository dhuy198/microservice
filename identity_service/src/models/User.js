const mongoose = require("mongoose");
const argon2 = require("argon2");

const userScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userScheme.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      return next(error);
    }
  }
});

userScheme.methods.comparePassword = async function (password) {
  try {
    return await argon2.verify(this.password, password);
  } catch (error) {
    throw error;
  }
};

userScheme.index({ name: "text" });

module.exports = mongoose.model("User", userScheme);
