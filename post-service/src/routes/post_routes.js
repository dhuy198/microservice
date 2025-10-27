const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/post_controllers");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express();

//middleware -> this will tell if the user is an auth user or not
router.use(authenticateRequest);

router.post("/create", createPost);
router.get("/", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;
