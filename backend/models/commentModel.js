import mongoose from "mongoose";
import { maxLength } from "zod";

const commentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required:true,
            maxLength: 2000
        },
        upvotes: {
            type: Number,
            default: 0
        },
        downvotes: {
            type:Number,
            default: 0
        },
        voters: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                voteType: {
                    type: String,
                    enum: ["up","down"]
                }
            }
        ]
    },
    {
        timestamps: true
    }
)

commentSchema.index({ post: 1, createdAt: -1})

const Comment = mongoose.model("Comment",commentSchema)
export default Comment 