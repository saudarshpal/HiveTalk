import express from "express";
import { createProfile,deleteAccount,followUser, getCommunities, getUserById, getUsers, Signin, Signup, subscribe, unfollowUser, unSubscribe,Verify } from "../controllers/userControllers.js";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.js";



const router = express.Router()


const upload = multer({dest : '/tmp/uploads/user/'})
const uploadMiddleware = upload.fields([{name : 'avatar', maxCount : 1},{name : 'userBanner', maxCount : 1}])


router.post('/signup',Signup) 
router.post('/signin',Signin)
router.get('/:userId',authMiddleware,getUserById)// get user by id
router.get('/bulk',authMiddleware,getUsers)// get all users
router.post('/profile',authMiddleware,uploadMiddleware,createProfile)// create or update user profile
router.post('/follow/:followUserId',authMiddleware,followUser) // follow user
router.delete('/unfollow/:unfollowUserId',authMiddleware,unfollowUser) // unfollow user
router.post('/subscribe/:communityId',authMiddleware,subscribe)// subscribe to community
router.post('/unsubscribe/:communityId',authMiddleware,unSubscribe) // unsubscribe from community
router.get('/community',authMiddleware,getCommunities) //get communities for specific user
router.delete('/delete/own',deleteAccount)



export default router