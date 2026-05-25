import mongoose from "mongoose";
import { maxLength } from "zod";

const userSchema = new mongoose.Schema(
    {
        username : {
            type : String,
            unique : true,
            required : true,
            minLength : 5,
            maxLength : 20,
            trim: true
        },
        email : {
            type : String,
            unique : true,
            required : true,
            trim: true,     
        },
        password : {
            type : String,
            required : true,
            minLength : 8,
        },

        bio : {
            type: String,
            default: null,
            maxLength: 180
        },
        followers: [
            { 
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User' 
            }
        ],
        following: [
            { 
                type : mongoose.Schema.Types.ObjectId,
                ref : 'User' 
            }
        ],
        followerCount: {
            type: Number,
            default: 0 
        },
        followingCount: { 
            type: Number,
            default: 0
        },
        profile : {
            avatar : { 
                exists: {
                    type : Boolean,
                    default : false
                },
                url : { 
                    type : String,
                    default : null
                },
                public_id: { 
                    type: String,
                    default: null
                }
            }
        },

        subscribedCommunitties: [
            { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "Community"
            }
        ],
    },
    {
        timestamps: true
    }
)

const User = mongoose.model('User',userSchema)
export default User