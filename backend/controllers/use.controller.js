import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (err) {
        return res.status(400).json({ message: "Get current user error" });
    }
};

export const updateAssistant = async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);
        console.log("USER ID:", req.userId);
        console.log("BODY:", req.body);

        console.log("FILE:", req.file);

        const { assistantName, imageUrl } = req.body;

        let assistantImage;

        if (req.file) {
            assistantImage = await uploadOnCloudinary(req.file.path);
        } else {
            assistantImage = imageUrl;
        }

        console.log("assistantName:", assistantName);
        console.log("assistantImage:", assistantImage);

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                assistantName,
                assistantImage,
            },
            { returnDocument: "after" }
        ).select("-password");

        console.log("UPDATED USER:", user);

        return res.status(200).json(user);
    } catch (err) {
        console.log(err);
        return res.status(400).json({ message: "Update assistant error" });
    }
};