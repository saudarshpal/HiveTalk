import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import {v2 as cloudinary}  from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

//connect to database
export const connectToDB = async()=>{
    try{
        const connect = await mongoose.connect(process.env.MONGODB_URL)
        console.log(`MongoDB Connected : ${connect.connection.host}`)
    }catch(err){
        console.log("Error Connecting To DataBase",err)
        process.exit(1)
    }
}

const PORT_NO = process.env.PORT
const JWT_TOKEN = process.env.JWT_SECRET
export {
    PORT_NO ,
    JWT_TOKEN
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary













