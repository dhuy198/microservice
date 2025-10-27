const express = require("express");
const {
  register,
  login,
  refreshTokenHandle,
  logout,
} = require("../controllers/identity_controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshTokenHandle);
router.post("/logout", logout);

module.exports = router;
