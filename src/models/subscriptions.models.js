import mongoose , {schema} from "mongoose"
import { User } from "./user.models"
const subscriptionsSchema = new Schema({
    subscriber:{
        type: schema.Types.objectId,
        ref: "User"
    },
    channel:{
        type: schema.Types.objectId,
        ref: "User"
    }
})
export const subscriptions=mongoose.model("subscriptions",subscriptionsSchema)