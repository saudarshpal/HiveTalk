import express from "express"
import multer from "multer"
import { authMiddleware } from "../middlewares/auth.js"
import {
  getCommunities,
  getCommunityById,
  getUserAdminCommunities,  
  getCommunityPosts,        
  createCommunity,
  deleteCommunity,
  followCommunity,
  unFollowCommunity,
  addModerator,
} from "../controllers/communityControllers.js"

const router = express.Router()

const upload = multer({ dest: "/tmp/uploads/community/" })
const uploadBanner = upload.single("communityBanner")

router.use(authMiddleware)

router.get("/bulk", getCommunities)
router.get("/user/:userId", getUserAdminCommunities)
router.post("/create", uploadBanner, createCommunity)    
router.get("/:communityId", getCommunityById)
router.get("/posts/:communityId", getCommunityPosts)     
router.delete("/:communityId", deleteCommunity)          
router.post("/follow/:communityId", followCommunity)
router.delete("/unfollow/:communityId", unFollowCommunity) 
router.put("/add-moderator/:communityId/:moderatorId", addModerator)

export default router