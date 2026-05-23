import User from "../models/userModel.js";
import { signinValid, signupValid } from "../zod/userzod.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from "../config.js";
import { JWT_TOKEN } from "../config.js";
import {v4 as uuidv4 } from 'uuid' ;
import Community from "../models/communityModel.js"
import dotenv from 'dotenv'
dotenv.config()


export const Signup = async (req, res) => {
  const { username, email, password } = req.body

  const { success } = signupValid.safeParse(req.body)
  if (!success) {
    return res.status(400).json({ message: "Enter valid inputs" })
  }

  try {
    // 1. Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)

    // 4. Create the user
    const user = await User.create({
      username,
      email,
      password: hashPassword,
    })

    // 6. Sign JWT
    const token = jwt.sign({ userId: user._id }, JWT_TOKEN, { expiresIn: "1h" })

    return res.status(201).json({
      message: "User created successfully",
      userId: user._id,
      token,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "User signup error" })
  }
}

export const Signin = async(req,res)=>{
    const {email,password} = req.body
    const {success} = signinValid.safeParse(req.body)
    if(!success){
        return res.status(400).json({
            message: "enter valid inputs"
        })
    }
    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({
                message : "User Not Found"
            })
        }
        const isPasswordValid = await bcrypt.compare(password,user.password)
        if(!isPasswordValid){
            return res.status(401).json({
                message : "Invalid Credentials"
            })
        }
        const userId = user._id
        const token = jwt.sign({userId},JWT_TOKEN,{expiresIn:'1h'})
        return res.status(200).json({
            message : "Signin Successful",
             userId,
             token : token
            })   
    }catch(err){
        console.log(err)
        return res.status(500).json({
            message : "Sign in Error "
        })
    }
}

export const getUserById = async(req,res)=>{
    const {userId} = req.params
    try{
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({
                msg : "User not Found"
            })
        }
        return res.status(200).json({
            user : user
        })
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }
}

export const getUsers = async(req,res)=>{
    const filter = req.query.filter || ""

    let users = await User.find({
            username : {
                "$regex" : filter,
                "$options": "i"
                }
    })
    users = users.filter(user => user._id.toString() !== req.userId)
    return res.status(200).json({
        user : users.map( user=>({
        _id : user._id,
        username : user.username,
        displayName: user.profile?.displayName 
       }))
    }) 
}

export const createProfile = async(req,res)=>{
    const userId = req.userId
    const {gender} = req.body
    let avatarUrl,userBannerUrl
    try {
        let user = await User.findById(userId)
        if(!user){
            return res.status(404).json({
                msg : "user not found"
            })
        }
        if(req.files?.avatar && req.files.avatar[0]){
            const result = await  cloudinary.uploader.upload(req.files.avatar[0].path)
            avatarUrl = result.secure_url
        }
        if(req.files?.userBanner && req.files.userBanner[0]){
            const result = await cloudinary.uploader.upload(req.files.userBanner[0].path)
            userBannerUrl = result.secure_url
        }
        user.profile = {
            gender,
            avatar : { 
                exists : avatarUrl ? true : false,
                url  : avatarUrl
            },
            banner :{
                exists : userBannerUrl ? true : false,
                url : userBannerUrl
            }
        }
        await user.save()
        return res.status(200).json({
            msg : "Profile Created"
        })
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }
}
 
export const followUser = async(req,res)=>{
    const userId = req.userId
    const {followUserId} = req.params
    try{
        const user = await User.findById(userId)
        const followUser = await User.findById(followUserId)
        if(!user || !followUser){
            return res.status(404).json({
                msg : "User Not Found"
            })
        }
        if(user.following.includes(followUserId)){
            return res.status(400).json({
                msg : "Already Following"
            })
        }
        user.following.push(followUserId)
        followUser.followers.push(userId)
        await user.save()
        await followUser.save()
        return res.status(200).json({
            msg : "User Followed"
        }) 
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }
}

export const unfollowUser = async(req,res)=>{
    const userId = req.userId
    const {unfollowUserId} = req.params
    try{
        const user = await User.findById(userId)
        const unfollowUser = await User.findById(unfollowUserId) 
        if(!user || !unfollowUser){
            return res.status(404).json({
                msg : "User Not Found"
            })
        }       
        if( !user.following.includes(unfollowUserId)){
            return res.status(400).json({
                msg : "Not Following"
            })
        }
        user.following = user.following.filter(id => id.toString() !== unfollowUserId)
        unfollowUser.followers = unfollowUser.followers.filter(id => id.toString() !== userId)
        await user.save()
        await unfollowUser.save()
        return res.status(200).json({
            msg : "User Unfollowed"
        }) 
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }

}

export const subscribe = async(req,res)=>{
    const userId = req.userId
    const {communityId} = req.params
    try{
        let community = await Community.findById(communityId)
        if(!community){
            return res.status(404).json({
                msg : "Community Not Found"
            })
        }   
        if(community.subscribers.includes(userId)){
            return res.status(400).json({
                msg : "Already Subscribed"
            })
        }
        community.subscribers.push(userId)
        community.count.subscribers ++
        await community.save()

        return res.status(200).json({
            msg : "Community Followed"
        }) 
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }
}


export const unSubscribe = async(req,res)=>{
    const userId = req.userId
    const {communityId} = req.params 
    try{
        const community = await Community.findById(communityId)

        if(!community){
            return res.status(404).json({msg : "User or Community Not Found"})
        }
        if(!community.subscribers.includes(userId)){
            return res.status(400).json({msg : "Not Subscribed"})
        }

        community.subscribers = community.subscribers.filter(id => id.toString() !== userId)
        community.count.subscribers -= 1
        await community.save()

        return res.status(200).json({msg : "Community Unfollowed"}) 
    }catch(err){           

        console.log(err)
        return res.status(500).json({msg : "Internal Server Error"})
    }
}


export const getCommunities = async(req,res)=>{
    const userId = req.userId
    try{
        let communities = await Community.find({
            subscribers : userId
        })
        return res.status(200).json({communities})
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }
}

export const deleteAccount = async(req,res)=>{
    const userId = req.userId
    try{
        let user = await User.findById(userId)
        if(!user){
            return res.status(402).json({
                msg : "user not found"
            })
        }
        await User.findByIdAndDelete(userId)
        return res.status(200).json({
            msg : "User Deleted"
        })
    }catch(err){
        console.log(err)
        return res.status(500).json({
            msg : "Internal Server Error"
        })
    }
}