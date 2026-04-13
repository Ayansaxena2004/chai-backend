import {asyncHandler} from  "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
const registerUser= asyncHandler(async(req,res)=>{
    /* get user detail fom frontend 
    validation - not empty
    check if user already exists; username,email
    check for image ,check for avtar
    upload them to cloudinary 
    create user object - create entry in db 
    remove password and refresh token field from respnse 
    check for user craetion 
    return result 
     */
    const {fullName, email, username, password } = req.body
    //console.log("email:", email);
    if (fullName === "")
        throw new apiError(400, "fullName is required")
    if (email === "")
        throw new apiError(400, "email is required")
    if (username === "")
        throw new apiError(400, "username is required")
    if (password === "")
        throw new apiError(400, "password is required")
    
    const existedUser=await User.findOne({
        $or: [{username},{email}]
    })
    if (existedUser){ 
        throw new apiError(409,"user with email and username is already exist")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImagelocalpath=req.files?.coverImage[0]?.path
    if (!avatarLocalPath){
        throw new apiError(400,"avatar is required")
    };
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImagelocalpath)
    if (!avatar){
        throw new apiError(400,"avatar is required")
    }

   const user =await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url ||"",
        email,
        username:username.toLowercase(),
        password
    });
    const createdUser=await user.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new apiError(500, "something went wrong while registering user")
    }
    return res.status(201).json(
        new apiResponse(200,createdUser, "user registered successfully")
        
    ); 
    //console.log("existedUser",existedUser)
   // if ({fullname, email, username, password}.some(field) = field?.trim()="")*/
});

export {registerUser}