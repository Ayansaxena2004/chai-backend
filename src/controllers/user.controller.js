import {asyncHandler} from  "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
import jwt from "jsonWebToken"
import { hasSubscribers } from "diagnostics_channel"
const generateAccessAndRefreshToken=async(UserId)=>{     
    try{
        const user= await User.findById(UserId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    }
    catch{
        throw new apiError(501,"something went wrong while generating access and refresh token")
    }
}
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
        username:username.toLowerCase(),
        password
    });
    const createdUser=await User.findById(user._id).select(
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
const loginUser = asyncHandler(async(req,res)=>{
    //req body->data
    //username and email- login use 
    //find the user 
    //password check 
    //access and refresh token 
    //send cookies 
    const {username, email, password}=req.body 
    if (!(username || email)){
        throw new apiError(400,"username and email is required")
    };
    const user = await User.findOne({
        $or:[{username},{email}]
    });
    if (!user){
        throw new apiError(404,"user does not exist")
    };
    const isPasswordValid=await user.isPasswordCorrect(password)
    if (!isPasswordValid){
        throw new apiError(401,"invalid user credentials")
    };
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    const options ={
        httpsOnly: true,
        secure: true
    }
    return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
});
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: undefined
        },
        {
            new: true
        }
    );
    const option={
        httpsOnly:true,
        secure:true
    };
    return res
    .status(200)
    .clearCookies("accessToken",option)
    .clearCookies("refreshToken",option)
    .json(
        new apiResponse(200,{},"user logged out")
    )
});
const refreshAccessToken= asyncHandler(async(req,res)=>{
const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new apiError(401,"unauthorized request")
    }
try {
        const decodedRefreshToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedRefreshToken?._id)
        if (!user){
            throw new apiError(401,"invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401,"refresh token is expired or used")
        }
        
        const options={
            httpsOnly: true,
            secure: true
        }
         
        const {accessToken,newRefreshToken}= generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(200,
                {accessToken,refreshToken: newRefreshToken},
                "accessToken refreshed"
            )
        ) 
} catch (error) {
    throw new apiError(401,error?.message || "invalid refreshToken")
}

});
const changeCurrentPassword= asyncHandler (async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user =await User.findById(req.user?._id)
    const isPasswordCorrect= await User.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect){
        throw new apiError(400,"oldPassword is invalid")
    }
    user.password=newPassword
    await user.save({validationBeforeSave: false})
    return res 
    .status(200)
    .json(new apiResponse(200,{},"password is changed successfully"))
}); 
const getCurrentUser= asyncHandler (async(req,res)=>{
    return res
    .status(200)
    .json(new apiResponse(200,req.user,"current user fetched succesfully"))
});
const updateAccountDetail= asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if (!fullName || !email){
        throw new apiError(400,"fullName and email is required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            fullName,
            email: email
        }
    },
    {new: true}
).select("- password")
return res
.status(200)
.json(new apiResponse(200,user,"account details is updated successfully"))
});
const updateCoverImage= asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath){
        throw new apiError(400,"cover image is required")
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage){
        throw new apiError(400,"error while uploading on coverImage")
    }
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
            coverImage: coverImage.url
        }
        },
        {new: true}
    ).select("- password")
    return res
    .status(200)
    .json(new apiResponse(200,user,"coverImage is updated successfully"))
});
const updateAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath){
        throw new apiError(400,"avatar is required")
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    if (!avatar){
        throw new apiError(400,"error while uploading on avatar")
    }
    await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
            avatar: avatar.url
        }
        },
        {new: true}
    ).select("- password")
    return res
    .status(200)
    .json(new apiResponse(200,user,"avatar is updated successfully"))
});
const getUserChannelProfile = asyncHandler (async(req,res)=>{
    const {username} = req.params
    if (!username?.trim()){
        throw new apiError(402,"username is required")
    }
    const channel = await User.aggregate([
        {
        $match:{
            username:username.toLowerCase
        }
    },
    {
        $lookup:{
            from:subscriptions,
            localfield: _id,
            foreignfield: channel,
            as:subscribers
        }
    },
    {
        $lookup:{
            from:subscriptions,
            localfield: _id,
            foreignfield: subscribers,
            as:subscribedTo
        }
    },
    {
        $addFields:
        {
            subscribersCount:{
                $size: subscribers
            },
            channelSubscribedToCount:{
                $size: subscribedTo
            },
            isSubscribe:{
                $cond:{
                    if:{
                        $in:[req.user?._id,"$subscribers.subscriber"]
                    },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project:{
            username: 1,
            fullName: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribe: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
        }
    } 
])
if(!channel?.length){
    throw new apiError(402,"channel does not exist") 
}
return res
.status(200)
.json(new apiResponse(200,channel[0],"user channel fetched successfully"))
});
const watchHistory= asyncHandler(async(req,res)=>{
    const user= await User.aggregate([
        {
            $match:{
                _id:mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField:"_id",
                as:"watchHistory",
               pipeline:[
                {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner"
                },
                $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                }
               },
               {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    }
                }
               }
            ] 
            }
        }
    ])
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateCoverImage,
    updateAvatar,
    getUserChannelProfile,
    watchHistory
}