import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import dotenv from "dotenv";
import generateResponse from "../groq.js";

dotenv.config();

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Get Current User Error:", err);

    return res.status(400).json({
      message: "Get current user error",
    });
  }
};

export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;

    let assistantImage;

    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      assistantImage = imageUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        assistantName,
        assistantImage,
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json(user);
  } catch (err) {
    console.error("Update Assistant Error:", err);

    return res.status(400).json({
      message: "Update assistant error",
    });
  }
};

const createBaseResponse = (result, command) => {
  return {
    emotion: result?.emotion || "neutral",
    userInput: result?.userInput || command,
    riskLevel: result?.riskLevel || "none",
  };
};

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const cleanAssistantName = (text = "", assistantName = "") => {
  if (!assistantName) {
    return text.trim();
  }

  const escapedName = assistantName.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  return text
    .replace(
      new RegExp(`^${escapedName}\\s+`, "i"),
      ""
    )
    .trim();
};

const cleanImageQuery = (text = "") => {
  let query = text.trim();

  query = query
    .replace(
      /^(hey\s+)?(search|find|show|show me|open|get|look for|look|see|give|give me)\s+/i,
      ""
    )
    .trim();

  query = query
    .replace(
      /^(the\s+)?(images?|pictures?|photos?|pics?|wallpapers?)\s+(of\s+)?/i,
      ""
    )
    .trim();

  query = query
    .replace(
      /\s+(images?|pictures?|photos?|pics?|wallpapers?)$/i,
      ""
    )
    .trim();

  query = query
    .replace(/^for\s+/i, "")
    .trim();

  return query || text.trim();
};

const isImageSearchCommand = (command = "") => {
  const normalized = normalizeText(command);

  const hasImageWord =
    /\b(images?|pictures?|photos?|pics?|wallpapers?)\b/i.test(
      normalized
    );

  const hasSearchWord =
    /\b(search|find|show|open|get|look|see|give)\b/i.test(
      normalized
    );

  return hasImageWord && hasSearchWord;
};

const isCloseImagesCommand = (command = "") => {
  const normalized = normalizeText(command);

  return (
    /\b(close|hide|remove|dismiss)\b.*\b(images?|pictures?|photos?|pics?|wallpapers?)\b/i.test(
      normalized
    ) ||
    /\b(images?|pictures?|photos?|pics?|wallpapers?)\b.*\b(close|hide|remove|dismiss)\b/i.test(
      normalized
    )
  );
};

const searchImagesWithSerper = async (query) => {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("SERPER_API_KEY is missing");
  }

  const response = await fetch(
    "https://google.serper.dev/images",
    {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        safe: "active",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        "Serper image search failed"
    );
  }

  const items = Array.isArray(data?.images)
    ? data.images
    : [];

  return items
    .map((item, index) => ({
      id: `${Date.now()}-${index}`,
      title: item.title || "Image",
      link: item.imageUrl || "",
      thumbnailLink:
        item.thumbnailUrl ||
        item.imageUrl ||
        "",
      contextLink: item.link || "",
      source: item.source || "",
      domain: item.domain || "",
      width: item.imageWidth || 0,
      height: item.imageHeight || 0,
    }))
    .filter(
      (image) =>
        image.thumbnailLink ||
        image.link
    );
};

const saveConversation = async (
  userId,
  userMessage,
  assistantMessage
) => {
  if (!userMessage || !assistantMessage) {
    return;
  }

  await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        conversationHistory: {
          $each: [
            {
              user: userMessage,
              assistant: assistantMessage,
              timestamp: new Date(),
            },
          ],
          $slice: -8,
        },
      },
    }
  );
};

export const askToAssistant = async (req, res) => {
  const cleanCommand =
    typeof req.body?.command === "string"
      ? req.body.command.trim()
      : "";

  try {
    if (!cleanCommand) {
      return res.status(400).json({
        type: "general",
        emotion: "neutral",
        userInput: "",
        riskLevel: "none",
        response: "Please say something.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response: "User not found.",
      });
    }

    const userName = user.name;
    const assistantName =
      user.assistantName || "Lucy";

    const previousHistory = Array.isArray(
      user.conversationHistory
    )
      ? user.conversationHistory.slice(-8)
      : [];

    const commandWithoutName =
      cleanAssistantName(
        cleanCommand,
        assistantName
      );

    if (
      isCloseImagesCommand(
        commandWithoutName
      )
    ) {
      const response = {
        type: "close_images",
        emotion: "neutral",
        userInput: "close images",
        response: "Closing the images.",
        riskLevel: "none",
      };

      await saveConversation(
        user._id,
        cleanCommand,
        response.response
      );

      return res.status(200).json(response);
    }

    if (
      isImageSearchCommand(
        commandWithoutName
      )
    ) {
      const imageQuery =
        cleanImageQuery(
          commandWithoutName
        );

      try {
        const images =
          await searchImagesWithSerper(
            imageQuery
          );

        const response = {
          type: "image_search",
          emotion: "neutral",
          userInput: imageQuery,
          query: imageQuery,
          images,
          response:
            images.length > 0
              ? `Showing image results for ${imageQuery}.`
              : `I couldn't find images for ${imageQuery}.`,
          riskLevel: "none",
        };

        await saveConversation(
          user._id,
          cleanCommand,
          response.response
        );

        return res.status(200).json(
          response
        );
      } catch (imageError) {
        const response = {
          type: "image_search",
          emotion: "neutral",
          userInput: imageQuery,
          query: imageQuery,
          images: [],
          response:
            "I couldn't get the image results right now.",
          riskLevel: "none",
          searchError:
            imageError.message,
        };

        await saveConversation(
          user._id,
          cleanCommand,
          response.response
        );

        return res.status(200).json(
          response
        );
      }
    }

    let result;

    try {
      result = await generateResponse(
        commandWithoutName,
        assistantName,
        userName,
        previousHistory
      );
    } catch (groqError) {
      console.error(
        "Groq Error:",
        groqError
      );

      return res.status(200).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response:
          "I'm having trouble processing that command right now.",
      });
    }

    let Result;

    try {
      Result =
        typeof result === "string"
          ? JSON.parse(result)
          : result;
    } catch (error) {
      console.error(
        "Invalid Groq JSON:",
        result
      );

      return res.status(200).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response:
          "Sorry, I couldn't understand that.",
      });
    }

    if (
      !Result ||
      typeof Result !== "object"
    ) {
      return res.status(200).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response:
          "Sorry, I couldn't understand that.",
      });
    }

    const base = createBaseResponse(
      Result,
      cleanCommand
    );

    let responseData = {
      ...Result,
      ...base,
    };

    if (Result.type === "general") {
      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response
      );

      return res.status(200).json(
        responseData
      );
    }

    if (
      Result.type === "google_search"
    ) {
      const query =
        Result.userInput ||
        cleanCommand;

      responseData = {
        ...responseData,
        url:
          "https://www.google.com/search?q=" +
          encodeURIComponent(query),
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response ||
          `Searching Google for ${query}.`
      );

      return res.status(200).json(
        responseData
      );
    }

    if (
      Result.type === "youtube_search"
    ) {
      const query =
        Result.userInput ||
        cleanCommand;

      responseData = {
        ...responseData,
        url:
          "https://www.youtube.com/results?search_query=" +
          encodeURIComponent(query),
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response ||
          `Searching YouTube for ${query}.`
      );

      return res.status(200).json(
        responseData
      );
    }

    if (
      Result.type === "youtube_play"
    ) {
      const searchQuery = (
        Result.userInput ||
        cleanCommand
      )
        .replace(/^play\s+/i, "")
        .replace(
          /^listen to\s+/i,
          ""
        )
        .replace(
          /^put on\s+/i,
          ""
        )
        .replace(
          /^watch\s+/i,
          ""
        )
        .trim();

      const apiKey =
        process.env.YOUTUBE_API_KEY;

      if (!apiKey) {
        const response = {
          type: "general",
          emotion: "neutral",
          userInput: cleanCommand,
          riskLevel: "none",
          response:
            "YouTube is not configured yet.",
        };

        await saveConversation(
          user._id,
          cleanCommand,
          response.response
        );

        return res.status(200).json(
          response
        );
      }

      try {
        const youtubeResponse =
          await fetch(
            "https://www.googleapis.com/youtube/v3/search" +
              `?part=snippet` +
              `&type=video` +
              `&maxResults=1` +
              `&q=${encodeURIComponent(
                searchQuery
              )}` +
              `&key=${apiKey}`
          );

        const youtubeData =
          await youtubeResponse.json();

        if (
          !youtubeResponse.ok ||
          !Array.isArray(
            youtubeData.items
          ) ||
          youtubeData.items.length === 0
        ) {
          const response = {
            ...responseData,
            response:
              `I couldn't find ${searchQuery} on YouTube.`,
          };

          await saveConversation(
            user._id,
            cleanCommand,
            response.response
          );

          return res.status(200).json(
            response
          );
        }

        const firstVideo =
          youtubeData.items[0];

        const videoId =
          firstVideo?.id?.videoId;

        const videoTitle =
          firstVideo?.snippet?.title ||
          searchQuery;

        if (!videoId) {
          const response = {
            ...responseData,
            response:
              `I couldn't find ${searchQuery} on YouTube.`,
          };

          await saveConversation(
            user._id,
            cleanCommand,
            response.response
          );

          return res.status(200).json(
            response
          );
        }

        const response = {
          ...responseData,
          type: "youtube_play",
          videoId,
          userInput: searchQuery,
          url:
            `https://www.youtube.com/watch?v=${videoId}`,
          response:
            `Playing ${videoTitle} on YouTube.`,
        };

        await saveConversation(
          user._id,
          cleanCommand,
          response.response
        );

        return res.status(200).json(
          response
        );
      } catch (youtubeError) {
        console.error(
          "YouTube API Error:",
          youtubeError
        );

        const response = {
          type: "general",
          emotion: "neutral",
          userInput: cleanCommand,
          riskLevel: "none",
          response:
            "I couldn't connect to YouTube right now.",
        };

        await saveConversation(
          user._id,
          cleanCommand,
          response.response
        );

        return res.status(200).json(
          response
        );
      }
    }

    if (
      Result.type === "weather_show"
    ) {
      responseData = {
        ...responseData,
        url:
          "https://www.google.com/search?q=weather",
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response ||
          "Showing the weather."
      );

      return res.status(200).json(
        responseData
      );
    }

    if (Result.type === "get_time") {
      responseData = {
        ...responseData,
        response:
          new Date().toLocaleTimeString(
            "en-IN"
          ),
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response
      );

      return res.status(200).json(
        responseData
      );
    }

    if (Result.type === "get_date") {
      responseData = {
        ...responseData,
        response:
          new Date().toLocaleDateString(
            "en-IN"
          ),
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response
      );

      return res.status(200).json(
        responseData
      );
    }

    if (Result.type === "get_day") {
      responseData = {
        ...responseData,
        response:
          new Date().toLocaleDateString(
            "en-US",
            {
              weekday: "long",
            }
          ),
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response
      );

      return res.status(200).json(
        responseData
      );
    }

    if (Result.type === "get_month") {
      responseData = {
        ...responseData,
        response:
          new Date().toLocaleDateString(
            "en-US",
            {
              month: "long",
            }
          ),
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response
      );

      return res.status(200).json(
        responseData
      );
    }

    if (
      Result.type ===
      "calculator_open"
    ) {
      responseData = {
        ...responseData,
        url:
          "https://www.google.com/search?q=calculator",
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response ||
          "Opening the calculator."
      );

      return res.status(200).json(
        responseData
      );
    }

    if (
      Result.type ===
      "instagram_open"
    ) {
      responseData = {
        ...responseData,
        url:
          "https://www.instagram.com",
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response ||
          "Opening Instagram."
      );

      return res.status(200).json(
        responseData
      );
    }

    if (
      Result.type ===
      "facebook_open"
    ) {
      responseData = {
        ...responseData,
        url:
          "https://www.facebook.com",
      };

      await saveConversation(
        user._id,
        cleanCommand,
        responseData.response ||
          "Opening Facebook."
      );

      return res.status(200).json(
        responseData
      );
    }

    await saveConversation(
      user._id,
      cleanCommand,
      responseData.response ||
        "Done."
    );

    return res.status(200).json({
      ...responseData,
      type: Result.type || "general",
    });
  } catch (err) {
    console.error(
      "ASK ASSISTANT ERROR:",
      err
    );

    return res.status(200).json({
      type: "general",
      emotion: "neutral",
      userInput: cleanCommand,
      response:
        "I'm having trouble processing that right now.",
      riskLevel: "none",
    });
  }
};