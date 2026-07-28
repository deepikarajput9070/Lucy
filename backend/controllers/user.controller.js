import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";

// Signup Controller
export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = await genToken(user._id);

    // Cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 10 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false,
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// Login Controller
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = await genToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 10 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false,
    });

    return res.status(200).json({
      message: "Login successful",
      user,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// Logout Controller
export const Logout = async (req, res) => {
  try {
    res.clearCookie("token");

    return res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
