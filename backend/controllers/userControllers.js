import User from "../models/userModel.js"
import Community from "../models/communityModel.js"
import { signinValid, signupValid } from "../zod/userzod.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import cloudinary from "../config.js"
import { JWT_TOKEN } from "../config.js"

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const Signup = async (req, res) => {
  const { username, email, password } = req.body
  const { success } = signupValid.safeParse(req.body)
  if (!success) return res.status(400).json({ message: "Enter valid inputs" })

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) return res.status(409).json({ message: "Email already exists" })

    const existingUsername = await User.findOne({ username })
    if (existingUsername) return res.status(409).json({ message: "Username already taken" })

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)

    const user = await User.create({ username, email, password: hashPassword })
    const token = jwt.sign({ userId: user._id }, JWT_TOKEN, { expiresIn: "7d" })

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

export const Signin = async (req, res) => {
  const { email, password } = req.body
  const { success } = signinValid.safeParse(req.body)
  if (!success) return res.status(400).json({ message: "Enter valid inputs" })

  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: "User not found" })

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" })

    const token = jwt.sign({ userId: user._id }, JWT_TOKEN, { expiresIn: "7d" })

    return res.status(200).json({
      message: "Signin successful",
      userId: user._id,
      token,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Signin error" })
  }
}

// ─── User ─────────────────────────────────────────────────────────────────────

export const getUserById = async (req, res) => {
  const { userId } = req.params
  try {
    const user = await User.findById(userId).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })

    return res.status(200).json({ user })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const getUsers = async (req, res) => {
  const filter = req.query.filter || ""
  try {
    const users = await User.find({
      username: { $regex: filter, $options: "i" },
      _id: { $ne: req.userId }, 
    }).select("_id username profile.avatar").limit(20)

    return res.status(200).json({ users })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const createProfile = async (req, res) => {
  const userId = req.userId
  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    if (req.files?.avatar?.[0]) {
      if (user.profile?.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.profile.avatar.public_id)
      }
      const result = await cloudinary.uploader.upload(req.files.avatar[0].path)
      user.profile.avatar = {
        exists: true,
        url: result.secure_url,
        public_id: result.public_id,
      }
    }

    if (req.body.bio !== undefined) {
      user.bio = req.body.bio
    }

    await user.save()
    return res.status(200).json({ message: "Profile updated" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteAccount = async (req, res) => {
  const userId = req.userId
  try {
    const user = await User.findByIdAndDelete(userId) 
    if (!user) return res.status(404).json({ message: "User not found" })

    return res.status(200).json({ message: "Account deleted" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Follow / Unfollow ────────────────────────────────────────────────────────

export const followUser = async (req, res) => {
  const userId = req.userId
  const { followUserId } = req.params

  if (userId === followUserId) {
    return res.status(400).json({ message: "You cannot follow yourself" })
  }

  try {
    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(followUserId),
    ])

    if (!user || !targetUser) return res.status(404).json({ message: "User not found" })

    if (user.following.includes(followUserId)) {
      return res.status(400).json({ message: "Already following" })
    }
  
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { following: followUserId },
        $inc: { followingCount: 1 },
      }),
      User.findByIdAndUpdate(followUserId, {
        $addToSet: { followers: userId },
        $inc: { followerCount: 1 },
      }),
    ])

    return res.status(200).json({ message: "User followed" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const unfollowUser = async (req, res) => {
  const userId = req.userId
  const { unfollowUserId } = req.params

  if (userId === unfollowUserId) {
    return res.status(400).json({ message: "You cannot unfollow yourself" })
  }

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    if (!user.following.includes(unfollowUserId)) {
      return res.status(400).json({ message: "Not following" })
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { following: unfollowUserId },
        $inc: { followingCount: -1 },
      }),
      User.findByIdAndUpdate(unfollowUserId, {
        $pull: { followers: userId },
        $inc: { followerCount: -1 },
      }),
    ])

    return res.status(200).json({ message: "User unfollowed" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Community Subscribe / Unsubscribe ───────────────────────────────────────

export const subscribe = async (req, res) => {
  const userId = req.userId
  const { communityId } = req.params
  try {
    const community = await Community.findById(communityId)
    if (!community) return res.status(404).json({ message: "Community not found" })

    if (community.subscribers.includes(userId)) {
      return res.status(400).json({ message: "Already subscribed" })
    }

    await Promise.all([
      Community.findByIdAndUpdate(communityId, {
        $addToSet: { subscribers: userId },
        $inc: { subscriberCount: 1 }, 
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { subscribedCommunitties: communityId }, 
      }),
    ])

    return res.status(200).json({ message: "Subscribed to community" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const unSubscribe = async (req, res) => {
  const userId = req.userId
  const { communityId } = req.params
  try {
    const community = await Community.findById(communityId)
    if (!community) return res.status(404).json({ message: "Community not found" })

    if (!community.subscribers.includes(userId)) {
      return res.status(400).json({ message: "Not subscribed" })
    }

    await Promise.all([
      Community.findByIdAndUpdate(communityId, {
        $pull: { subscribers: userId },
        $inc: { subscriberCount: -1 }, 
      }),
      User.findByIdAndUpdate(userId, {
        $pull: { subscribedCommunitties: communityId },
      }),
    ])

    return res.status(200).json({ message: "Unsubscribed from community" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const getCommunities = async (req, res) => {
  const userId = req.userId
  try {
    const user = await User.findById(userId)
      .select("subscribedCommunitties")
      .populate("subscribedCommunitties", "name description banner subscriberCount")

    return res.status(200).json({ communities: user.subscribedCommunitties })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}