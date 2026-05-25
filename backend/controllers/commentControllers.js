import Comment from "../models/commentModel.js"
import Post from "../models/postModel.js"

// ─── Add Comment ──────────────────────────────────────────────────────────────

export const commentOnPost = async (req, res) => {
  const userId = req.userId
  const { postId } = req.params
  const { content } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ message: "Comment content is required" })
  }

  try {
    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ message: "Post not found" })

    const comment = await Comment.create({
      post: postId,
      author: userId,
      content: content.trim(),
    })

    const populated = await comment.populate("author", "username profile.avatar")

    return res.status(201).json({ message: "Comment added", comment: populated })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Get All Comments On Post ─────────────────────────────────────────────────

export const getAllComments = async (req, res) => {
  const { postId } = req.params
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  try {
    const post = await Post.findById(postId).select("_id")
    if (!post) return res.status(404).json({ message: "Post not found" })

    const [comments, total] = await Promise.all([
      Comment.find({ post: postId })
        .sort({ createdAt: -1 })              
        .skip(skip)
        .limit(limit)
        .populate("author", "username profile.avatar")
        .select("-voters"),                   
      Comment.countDocuments({ post: postId }),
    ])

    return res.status(200).json({
      comments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Delete Comment ───────────────────────────────────────────────────────────

export const deleteComment = async (req, res) => {
  const userId = req.userId
  const { commentId } = req.params

  try {
    const comment = await Comment.findById(commentId)
    if (!comment) return res.status(404).json({ message: "Comment not found" })

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" })
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json({ message: "Comment deleted" })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// ─── Vote On Comment ──────────────────────────────────────────────────────────

export const voteOnComment = async (req, res) => {
  const userId = req.userId
  const { commentId } = req.params
  const { voteType } = req.body               

  if (!["up", "down"].includes(voteType)) {
    return res.status(400).json({ message: "voteType must be 'up' or 'down'" })
  }

  try {
    const comment = await Comment.findById(commentId)
    if (!comment) return res.status(404).json({ message: "Comment not found" })

    const existingVote = comment.voters.find((v) => v.user.toString() === userId)

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        comment.voters = comment.voters.filter((v) => v.user.toString() !== userId)
        if (voteType === "up") comment.upvotes = Math.max(0, comment.upvotes - 1)
        else comment.downvotes = Math.max(0, comment.downvotes - 1)
      } else {
        existingVote.voteType = voteType
        if (voteType === "up") {
          comment.upvotes += 1
          comment.downvotes = Math.max(0, comment.downvotes - 1)
        } else {
          comment.downvotes += 1
          comment.upvotes = Math.max(0, comment.upvotes - 1)
        }
      }
    } else {
      comment.voters.push({ user: userId, voteType })
      if (voteType === "up") comment.upvotes += 1
      else comment.downvotes += 1
    }

    await comment.save()

    return res.status(200).json({
      message: "Vote recorded",
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}