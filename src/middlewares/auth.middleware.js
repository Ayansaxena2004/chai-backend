import { User } from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const verifyJWT= asyncHandler(async(req,res,next) => {
    try {
        //access token lere hai  cookies yah toh header se  
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token){
            throw new apiError(401,"unauthorized request")
        }
        console.log("token:", token)
        //token ko decode kre hai secret provide krke 
        const tokenDecoded= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //decoded token se id nikal rhe hai 
        console.log("tokenDecoded:",tokenDecoded)
        const user=await User.findById(tokenDecoded?._id).select(
            "-password -refreshToken"
        )
        if (!user){
            throw new apiError(401,"invalid access token")
        }
        //req mai user ka data store kre hai jisse br br Db se nha lena paade  
        req.user=user
        next()
    } catch (error) {
        throw new apiError(401,error?.message || "invalid access token")
    }
})
export {verifyJWT}