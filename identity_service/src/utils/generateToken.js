const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefeshToken");

const generateToken = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 7);
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expireAt,
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;
