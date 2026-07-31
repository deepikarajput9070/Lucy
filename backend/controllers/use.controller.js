import User from "../models/user.model.js";

export const getCurrentUser=async (req,res)=>
{
    try{
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user)
        {
            return res.status(400).json({message:"user not found"})
        }
        return res.status(200).json(user)
    }catch(err)
    {
        return res.status(400).json({message:"get current user error"})
    }
}

export const updateAssistant=async (req,res)=>{
    try{
        const {assistantName,imageUrl}=req.body
        const assistantImage;
        
        if(req.file)
        {
            assistantImage=await uploadOnCloudinary(req.file.path)
        }else{
            assistantImage=imageUrl
        }
        const user=await user.findByIdUpdate(req.userId,{
            assistantImage,assistantName
        },{new:true}.select("-password"))
        return res.status(200).json(user);

    }catch(err)
    {
        
    }
}