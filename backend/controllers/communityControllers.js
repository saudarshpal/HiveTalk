import Community from "../models/communityModel.js"
import Post from "../models/postModel.js"
import User from "../models/userModel.js"
import cloudinary from "../config.js"

// ─── Get All Communities ──────────────────────────────────────────────────────

export const getCommunities = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  try {
    const [communities, total] = await Promise.all([
      Community.find()
        .sort({ subscriberCount: -1 })         // most popular first
        .skip(skip)
        .limit(limit)
        .select("name description banner subscriberCount postCount"), // only what the card needs
      Community.countDocuments(),
    ])

    return res.status(200).json({
      communities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get Community By ID ──────────────────────────────────────────────────────

export const getCommunityById = async (req, res) => {
  const { communityId } = req.params
  try {
    const community = await Community.findById(communityId)
      .populate("admin", "username profile.avatar")
      .populate("moderators", "username profile.avatar")

    if (!community) return res.status(404).json({ message: "Community not found" })

    return res.status(200).json({ community })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get Communities A User Admins ────────────────────────────────────────────

export const getUserAdminCommunities = async (req, res) => {
  const { userId } = req.params
  try {
    const communities = await Community.find({ admin: userId })
      .select("name description banner subscriberCount postCount")
      .sort({ createdAt: -1 })

    return res.status(200).json({ communities })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get Community Posts ──────────────────────────────────────────────────────

export const getCommunityPosts = async (req, res) => {
  const { communityId } = req.params
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  try {
    const [posts, total] = await Promise.all([
      Post.find({ community: communityId })
        .sort({ createdAt: -1 })              
        .skip(skip)
        .limit(limit)
        .populate("author", "username profile.avatar")
        .select("-voters"),
      Post.countDocuments({ community: communityId }),
    ])

    return res.status(200).json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Create Community ─────────────────────────────────────────────────────────

export const createCommunity = async (req, res) => {
  const userId = req.userId                   
  const { name, description } = req.body

  try {
    const existing = await Community.findOne({ name })
    if (existing) return res.status(409).json({ message: "Community name already taken" })

    let bannerData = { exists: false, url: null, public_id: null }
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "communityBanners",
      })
      bannerData = { exists: true, url: result.secure_url, public_id: result.public_id }
    }

    const community = await Community.create({
      name,
      description,
      admin: userId,
      banner: bannerData,
      subscribers: [userId],                  
      subscriberCount: 1,
    })

    await User.findByIdAndUpdate(userId, {
      $addToSet: { subscribedCommunitties: community._id },
    })

    return res.status(201).json({ message: "Community created", community })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Delete Community ─────────────────────────────────────────────────────────

export const deleteCommunity = async (req, res) => {
  const userId = req.userId
  const { communityId } = req.params
  try {
    const community = await Community.findOne({ _id: communityId, admin: userId })
    if (!community) return res.status(404).json({ message: "Community not found or unauthorized" })

    if (community.banner?.public_id) {
      await cloudinary.uploader.destroy(community.banner.public_id)
    }

    await Community.findByIdAndDelete(communityId)

    return res.status(200).json({ message: "Community deleted" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Follow Community ─────────────────────────────────────────────────────────

export const followCommunity = async (req, res) => {
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

// ─── Unfollow Community ───────────────────────────────────────────────────────

export const unFollowCommunity = async (req, res) => {
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

// ─── Add Moderator ────────────────────────────────────────────────────────────

export const addModerator = async (req, res) => {
  const adminId = req.userId
  const { communityId, moderatorId } = req.params
  try {
    const [community, moderator] = await Promise.all([
      Community.findOne({ _id: communityId, admin: adminId }), 
      User.findById(moderatorId),
    ])

    if (!community) return res.status(404).json({ message: "Community not found or unauthorized" })
    if (!moderator) return res.status(404).json({ message: "User not found" })

    if (community.moderators.includes(moderatorId)) {
      return res.status(400).json({ message: "Already a moderator" })
    }

    await Community.findByIdAndUpdate(communityId, {
      $addToSet: { moderators: moderatorId },
    })

    return res.status(200).json({ message: "Moderator added" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}