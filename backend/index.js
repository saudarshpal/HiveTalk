import express from 'express';
import primaryRouter from './routes/index.js'
import { connectToDB, PORT_NO } from './config.js';
import cors from 'cors';


const app = express()
connectToDB();


app.use(cors({
    origin: "http://localhost:7070",
    credentials : true,
    methods : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())

app.get('/',(req,res)=>{
    res.status(200).send("Backend is Running")
})
app.use('/api/v1',primaryRouter)


app.listen(PORT_NO,()=>{
    console.log("Server is Running")
})