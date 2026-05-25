import mongoose from "mongoose";
import { maxLength } from "zod";


const postSchema  = new mongoose.Schema(
    {
        title :{
            type : String,
            required : true,
            maxLength: 200,
            trim: true
        },
        content :{
            type : String ,
            required : true,
            maxLength: 100000
        },
        images : {
            exists: {
                type: Boolean,
                default: false
            },
            url: {
                type: String,
                default: null
            },
            public_id: {
                type: String,
                default: null
            }
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 5,
                message: "A post have at most 5 tags"
            },
            index: true
        },
        author :{
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required : true,
            index: true
        },
        community : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Community',
            default: null,
            index: true,
        },
        upvotes : {
            type : Number,
            default : 0
        },
        downvotes : {
            type : Number,
            default : 0
        },
        voters: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                voteTyepe: {
                    type: String,
                    enum: ["up","down"]
                }
            }
        ]
    },
    {
        timestamps:true
    }
)

postSchema.index({ community: 1, createdAt: -1 })
 
postSchema.index({ author: 1, createdAt: -1 })


const Post = mongoose.model('Post',postSchema)

export default Post 