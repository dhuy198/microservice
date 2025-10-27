const logger = require("../utils/logger");
const { validateRegister, validateLogin } = require("../utils/validation");
const User = require("../models/User");
const RefreshToken = require("../models/RefeshToken");
const generateToken = require("../utils/generateToken");
//user register
const register = async (req, res) => {
  logger.info("registration");
  try {
    //validate
    const { err } = validateRegister(req.body);
    if (err) {
      logger.warn("validate", err.details[0].message);
      return res.status(404).json({
        message: err.details[0].message,
      });
    }
    const { email, name, password } = req.body;
    const Tuser = await User.findOne({ $or: [{ email }, { name }] });
    if (Tuser) {
      logger.warn("user exits");
      return res.status(404).json({
        message: "user exits",
      });
    }
    const user = new User({ email, name, password });
    await user.save().catch((e) => {
      logger.error("save user failed", e);
    });
    logger.warn(`user created success: ${user._id}`);
    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      message: "user create success",
      accessToken: accessToken,
      refreshToken: refreshToken,
      success: true,
    });
  } catch (error) {
    logger.error("register", error);
    res.status(500).json({
      message: error,
    });
  }
};

//user login
const login = async (req, res) => {
  logger.info("login");
  try {
    //validate
    const { err } = validateLogin(req.body);
    if (err) {
      logger.warn("validate", err.details[0].message);
      return res.status(404).json({
        message: err.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("user not found");
      return res.status(404).json({
        message: "user not found",
      });
    }

    // valid password
    const isValidPass = await user.comparePassword(password);
    if (!isValidPass) {
      logger.warn("invalid password");
      return res.status(404).json({
        message: "invalid password",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(201).json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("login", error);
    res.status(500).json({
      message: error,
    });
  }
};

//refesh token
const refreshTokenHandle = async (req, res) => {
  logger.info("refresh token");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expireAt < new Date()) {
      logger.warn("Invalid or expired refresh token");

      return res.status(401).json({
        success: false,
        message: `Invalid or expired refresh token`,
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      logger.warn("User not found");

      return res.status(401).json({
        success: false,
        message: `User not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    //delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("refresh token", error);
    res.status(500).json({
      message: error,
    });
  }
};

//logout
const logout = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    logger.info("Refresh token deleted for logout");

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    logger.error("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = { register, login, refreshTokenHandle, logout };
