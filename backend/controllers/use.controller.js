import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import { response } from "express";
import dotenv from "dotenv";

dotenv.config();

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

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;

    const user = await User.findById(req.userId);

    const userName = user.name;
    const assistantName = user.assistantName;

    const result = await geminiResponse(
      command,
      userName,
      assistantName
    );

    const jsonMatch = result.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      return res.status(400).json({
        response: "Sorry, I can't understand.",
      });
    }

    const Result = JSON.parse(jsonMatch[0]);

    const type = Result.type;

    switch (type) {
      case "general":
        return res.json(Result);

      case "google_search":
        Result.url = `https://www.google.com/search?q=${encodeURIComponent(
          Result.userInput
        )}`;
        return res.json(Result);

      case "youtube_search":
        Result.url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          Result.userInput
        )}`;
        return res.json(Result);

      case "youtube_play":
        Result.url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          Result.userInput
        )}`;
        return res.json(Result);

      case "weather_show":
        Result.url = "https://www.google.com/search?q=weather";
        return res.json(Result);

      case "get_time":
        Result.response = new Date().toLocaleTimeString();
        return res.json(Result);

      case "get_date":
        Result.response = new Date().toLocaleDateString();
        return res.json(Result);

      case "get_day":
        Result.response = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        return res.json(Result);

      case "get_month":
        Result.response = new Date().toLocaleDateString("en-US", {
          month: "long",
        });
        return res.json(Result);

      case "calculator_open":
        Result.url = "https://www.google.com/search?q=calculator";
        return res.json(Result);

      case "instagram_open":
        Result.url = "https://www.instagram.com";
        return res.json(Result);

      case "facebook_open":
        Result.url = "https://www.facebook.com";
        return res.json(Result);

      default:
        return res.json(Result);
    }
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      response: "Internal Server Error",
    });
  }
};