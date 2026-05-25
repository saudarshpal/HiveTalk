import cloudinary from "../config.js"
import Community from "../models/communityModel.js"
import Post from "../models/postModel.js"
import User from "../models/userModel.js"

// ─── Create Post ──────────────────────────────────────────────────────────────

export const createPost = async (req, res) => {
  const userId = req.userId
  const { title, content, communityName, tags } = req.body

  try {
    const [user, community] = await Promise.all([
      User.findById(userId),
      Community.findOne({ name: communityName }),
    ])

    if (!user) return res.status(404).json({ message: "User not found" })
    if (!community) return res.status(404).json({ message: "Community not found" })

    let imageData = { exists: false, url: null, public_id: null }
    if (req.files?.[0]) {
      const result = await cloudinary.uploader.upload(req.files[0].path, {
        folder: "postImages",
      })
      imageData = { exists: true, url: result.secure_url, public_id: result.public_id }
    }

    const post = await Post.create({
      title,
      content,
      images: imageData,
      tags: tags ?? [],
      author: userId,
      community: community._id,
    })

    await Community.findByIdAndUpdate(community._id, {
      $inc: { postCount: 1 },
    })

    return res.status(201).json({ message: "Post created", postId: post._id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get All Posts (feed) ─────────────────────────────────────────────────────

export const getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  try {
    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username profile.avatar")
        .populate("community", "name")
        .select("-voters"),                  
      Post.countDocuments(),
    ])

    return res.status(200).json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get Post By ID ───────────────────────────────────────────────────────────

export const getPostById = async (req, res) => {
  const { postId } = req.params
  try {
    const post = await Post.findById(postId)
      .populate("author", "username profile.avatar bio")
      .populate("community", "name banner")

    if (!post) return res.status(404).json({ message: "Post not found" })

    return res.status(200).json({ post })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get Posts By User ────────────────────────────────────────────────────────

export const getUserPosts = async (req, res) => {
  const { userId } = req.params
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const skip = (page - 1) * limit

  try {
    
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("community", "name")
      .select("-voters")

    return res.status(200).json({ posts })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Delete Post ──────────────────────────────────────────────────────────────

export const deletePost = async (req, res) => {
  const userId = req.userId
  const { postId } = req.params
  try {
    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ message: "Post not found" })

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    if (post.images?.public_id) {
      await cloudinary.uploader.destroy(post.images.public_id)
    }

    await Promise.all([
      Post.findByIdAndDelete(postId),
      Community.findByIdAndUpdate(post.community, { $inc: { postCount: -1 } }),
    ])

    return res.status(200).json({ message: "Post deleted" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Vote On Post ─────────────────────────────────────────────────────────────

export const voteOnPost = async (req, res) => {
  const userId = req.userId
  const { postId } = req.params
  const { voteType } = req.body 

  if (!["up", "down"].includes(voteType)) {
    return res.status(400).json({ message: "voteType must be 'up' or 'down'" })
  }

  try {
    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ message: "Post not found" })

    const existingVote = post.voters.find((v) => v.user.toString() === userId)

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        post.voters = post.voters.filter((v) => v.user.toString() !== userId)
        if (voteType === "up") post.upvotes = Math.max(0, post.upvotes - 1)
        else post.downvotes = Math.max(0, post.downvotes - 1)
      } else {
        existingVote.voteType = voteType
        if (voteType === "up") {
          post.upvotes += 1
          post.downvotes = Math.max(0, post.downvotes - 1)
        } else {
          post.downvotes += 1
          post.upvotes = Math.max(0, post.upvotes - 1)
        }
      }
    } else {
      post.voters.push({ user: userId, voteType })
      if (voteType === "up") post.upvotes += 1
      else post.downvotes += 1
    }

    await post.save()
    return res.status(200).json({
      message: "Vote recorded",
      upvotes: post.upvotes,
      downvotes: post.downvotes,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}