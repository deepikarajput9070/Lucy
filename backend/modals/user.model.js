import mongoose from "mongoose";

const userSchema =new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    assistant:{
        type:String,
        default:"Lucy"
    },
    AssistantAvatar:{
        type:String,
    },
    history:[
        {type:String}
    ]

},{timestamps:true})

const User=mongoose.model("User",userSchema)
export default User;