import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
    {
        name: {
            type :String,
            required : true,
            unique : true,
            maxLength : 30,
            trim: true,
        },
        description: {
            type : String,
            required : true,
            maxLength: 200
        },
        admin: {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required: true,
        },
        moderators : {
            type : [mongoose.Schema.Types.ObjectId],
            ref : 'User'
        },
        subscribers : {
            type : [mongoose.Schema.Types.ObjectId],
            ref : 'User'
        },
        subscriberCount: {
            type : Number,
            default : 0,
            index: true
        },
        postCount: {
            type :Number,
            default : 0,
        },
        banner:{
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
    {
        timestamps: true
    }
)

communitySchema.index({ subscriberCount: -1})

const Community = mongoose.model('Community',communitySchema)
export default Community

