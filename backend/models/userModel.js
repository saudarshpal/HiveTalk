import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        unique : true,
        required : true,
        minLength : 5,
        maxLength : 20,
    },
    email : {
        type : String,
        unique : true,
        required : true,       
    },
    password : {
        type : String,
        required : true,
        minLength : 8,
    },
    followers : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User'
        }
    ],
    following : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User'
        }
    ],
    profile : {
        gender : {
           type : String,
           default : null,
           enum : ['Male',"Female"]
        },
        avatar : {
            exists : {
                type : Boolean,
                default : false
            },
            url : {
                type : String,
                default : null
            }
        },
        banner:{
            exists: {
                type : Boolean,
                default : false
            },
            url : {
                type : String,
                default : null
            }
        }
    }
})

const User = mongoose.model('User',userSchema)

export default User