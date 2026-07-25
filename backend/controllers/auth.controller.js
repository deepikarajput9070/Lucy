import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
try{
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if(existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }
    if(password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user =new User.create({
         name, password: hashedPassword, email });


         const token = await genToken(user._id);
         res.cookie("token", token, {
            httpOnly: true,
            maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
            sameSite:"strict",
            secure: false
         });
         return res.status(201).json({ message: "User created successfully", user, token });

} catch (error) {
    res.status(500).json({ message: error.message });
}
}
export const Login = async (req, res) => {
try{
    const {email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
         const token = await genToken(user._id);
         res.cookie("token", token, {
            httpOnly: true,
            maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
            sameSite:"strict",
            secure: false
         });
         return res.status(201).json(user);

} catch (error) {
    res.status(500).json({ message: error.message });
}
}
export const Logout = async (req, res) => {
    try{
        res.clearCookie("token")
        return res.status(200).json({ message: "Logged out successfully" });
    }catch (error) {
        res.status(500).json({ message: error.message });
    }
}