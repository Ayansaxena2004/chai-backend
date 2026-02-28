import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"
//import mongoose from "mongoose"

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is connected successfully on : ${process.env.PORT} `)
    })
})
.catch((error)=>{
    console.log("mongo db connnection failed !!! ",error)
})