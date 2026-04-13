import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB=async () =>{
    try {
        console.log("check env ",process.env.MONGODB_URI)
        const connectionInstance= await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\n Mongodb connected !! DBHOST :${
            connectionInstance.connection.host
        }; ` )
        console.log(connectionInstance); 
    } catch (error) {
        console.log("MONGODB connection error",error);
        process.exit;
    }
}
export default connectDB
///?appName=Cluster0