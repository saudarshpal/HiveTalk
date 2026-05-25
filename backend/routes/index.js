import express from "express"
import userRouter from "./userRoutes.js"
import postRouter from "./postRoutes.js"
import communityRouter from "./communityRoutes.js"
import commentRouter from "./commentRoutes.js"

const router = express.Router()

router.use("/user", userRouter)
router.use("/post", postRouter)
router.use("/community", communityRouter)
router.use("/comment", commentRouter)   

export default router