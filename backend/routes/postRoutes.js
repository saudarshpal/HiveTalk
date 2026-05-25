import express from "express"
import multer from "multer"
import { authMiddleware } from "../middlewares/auth.js"
import {
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  deletePost,
  voteOnPost,
} from "../controllers/postControllers.js"

const router = express.Router()

const upload = multer({ dest: "/tmp/uploads/images/" })  
const uploadImages = upload.single("postImage")          

router.use(authMiddleware)

router.get("/all", getAllPosts)
router.get("/user/:userId", getUserPosts)
router.post("/create", uploadImages, createPost)
router.get("/:postId", getPostById)
router.delete("/:postId", deletePost)                     
router.post("/vote/:postId", voteOnPost)

export default router