import express from "express"
import { authMiddleware } from "../middlewares/auth.js"
import {
  commentOnPost,
  getAllComments,
  deleteComment,
  voteOnComment,
} from "../controllers/commentControllers.js"

const router = express.Router()

router.use(authMiddleware)

router.post("/vote/:commentId", voteOnComment)
router.post("/:postId", commentOnPost)
router.get("/:postId", getAllComments)
router.delete("/:commentId", deleteComment)

export default router