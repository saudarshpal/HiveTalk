import express from "express"
import multer from "multer"
import { authMiddleware } from "../middlewares/auth.js"
import {
  Signup,
  Signin,
  getUserById,
  getUsers,
  createProfile,
  deleteAccount,
  followUser,
  unfollowUser,
  subscribe,
  unSubscribe,
  getCommunities,
} from "../controllers/userControllers.js"

const router = express.Router()

const upload = multer({ dest: "/tmp/uploads/user/" })
const uploadMiddleware = upload.fields([{ name: "avatar", maxCount: 1 }])

router.post("/signup", Signup)
router.post("/signin", Signin)

router.get("/bulk", authMiddleware, getUsers)
router.get("/community", authMiddleware, getCommunities)
router.get("/:userId", authMiddleware, getUserById)
router.post("/profile", authMiddleware, uploadMiddleware, createProfile)
router.delete("/delete/own", authMiddleware, deleteAccount)  
router.post("/follow/:followUserId", authMiddleware, followUser)
router.delete("/unfollow/:unfollowUserId", authMiddleware, unfollowUser)
router.post("/subscribe/:communityId", authMiddleware, subscribe)
router.delete("/unsubscribe/:communityId", authMiddleware, unSubscribe) 

export default router