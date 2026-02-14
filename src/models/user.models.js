import mongoose , {schema} from "mongoose"
import bcrypt from "bcrypt"
import jsonWebToken  from "jsonwebtoken"
const userSchema=new schema({
    username:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        index:true,
        trim:true
    },
    avatar:{
        type:String //cloudinary url
    },
    coverImage:{
        type:String //cloudinary url
    },
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String
    },
    watchHistory:{
        type:schema.Types.ObjectId,
        ref:"video"
    }
},
{timestamps:true});
userSchema.pre("save", async function (next)
 {
    if (!this.isModified("password"))
        return(next)
    this.password=bcrypt.hash(this.password,10);
    (next)
});
userSchema.methods.isPasswordCorrect= async function (password){
    await bcrypt.compare(password,this.password)
};
userSchema.methods.generateAccessToken=async function(){
    jwt.sign({
        _id: this._id,
        username:this.username,
        fullName:this.fullName,
        email:this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.methods.generateRefreshToken=async function(){
    jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User=mongoose.model("User",userSchema);