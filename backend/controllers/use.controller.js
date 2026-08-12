import User from "../models/user.model.js";

import {
  getRecentMemory,
  saveMemory,
} from "../service/memory.service.js";

import {
  detectIntent,
} from "../service/intent.service.js";

import {
  uploadOnCloudinary,
} from "../config/cloudinary.js";

import dotenv from "dotenv";

import generateResponse from "../groq.js";

import {
  generateList,
  isListCommand,
  selectListItem,
} from "../service/list.service.js";

import {
  searchYouTube,
} from "../service/youtube.service.js";

dotenv.config();

// ============================================================
// CURRENT USER
// ============================================================

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(
      "Get Current User Error:",
      error?.message || error
    );

    return res.status(500).json({
      message: "Get current user error",
    });
  }
};

// ============================================================
// UPDATE ASSISTANT
// ============================================================

export const updateAssistant = async (req, res) => {
  try {
    const {
      assistantName,
      imageUrl,
    } = req.body;

    let assistantImage = "";

    if (req.file) {
      assistantImage = await uploadOnCloudinary(
        req.file.path
      );
    } else {
      assistantImage = imageUrl || "";
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        assistantName: assistantName || "Lucy",
        assistantImage,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(
      "Update Assistant Error:",
      error?.message || error
    );

    return res.status(400).json({
      message: "Update assistant error",
    });
  }
};

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ============================================================
// CLEAN ASSISTANT NAME
// ============================================================

const cleanAssistantName = (
  text = "",
  assistantName = ""
) => {
  const original = String(text).trim();

  const normalized = normalizeText(original);

  const name = normalizeText(assistantName);

  if (name && normalized === name) {
    return "";
  }

  if (
    name &&
    normalized.startsWith(`${name} `)
  ) {
    return normalized
      .slice(name.length)
      .trim();
  }

  return normalized;
};

// ============================================================
// IMAGE QUERY CLEANER
// ============================================================

const cleanImageQuery = (text = "") => {
  let query = String(text).trim();

  query = query.replace(
    /^(hey\s+)?(search|find|show|show me|open|get|look for|look|see|give|give me)\s+/i,
    ""
  );

  query = query.replace(
    /^(the\s+)?(images?|pictures?|photos?|pics?|wallpapers?)\s+(of\s+)?/i,
    ""
  );

  query = query.replace(
    /\s+(images?|pictures?|photos?|pics?|wallpapers?)$/i,
    ""
  );

  query = query.replace(
    /^for\s+/i,
    ""
  );

  return query.trim() || text.trim();
};

// ============================================================
// IMAGE SEARCH COMMAND
// ============================================================

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

// ============================================================
// CLOSE IMAGE COMMAND
// ============================================================

const isCloseImagesCommand = (command = "") => {
  const normalized = normalizeText(command);

  return (
    /\b(close|hide|remove|dismiss)\b/i.test(normalized) &&
    /\b(images?|pictures?|photos?|pics?|wallpapers?)\b/i.test(
      normalized
    )
  );
};

// ============================================================
// CLOSE LIST COMMAND
// ============================================================

const isCloseListCommand = (command = "") => {
  const normalized = normalizeText(command);

  return (
    /\b(close|hide|remove|dismiss)\b/i.test(normalized) &&
    /\b(list|results)\b/i.test(normalized)
  );
};

// ============================================================
// YOUTUBE CLOSE COMMAND
// ============================================================

const isYouTubeCloseCommand = (command = "") => {
  const normalized = normalizeText(command);

  const closeWord =
    /\b(close|exit|hide|remove|dismiss)\b/i.test(
      normalized
    );

  const youtubeWord =
    /\b(youtube|video|player)\b/i.test(
      normalized
    );

  return closeWord && youtubeWord;
};

// ============================================================
// YOUTUBE PAUSE COMMAND
// ============================================================

const isYouTubePauseCommand = (command = "") => {
  const normalized = normalizeText(command);

  const pauseWord =
    /\b(pause|stop|hold)\b/i.test(
      normalized
    );

  const youtubeWord =
    /\b(youtube|video|music|song|player)\b/i.test(
      normalized
    );

  return pauseWord && youtubeWord;
};

// ============================================================
// YOUTUBE RESUME COMMAND
// ============================================================

const isYouTubeResumeCommand = (command = "") => {
  const normalized = normalizeText(command);

  const resumeWord =
    /\b(resume|continue|unpause)\b/i.test(
      normalized
    );

  const youtubeWord =
    /\b(youtube|video|music|song|player)\b/i.test(
      normalized
    );

  return resumeWord && youtubeWord;
};

// ============================================================
// YOUTUBE PLAY COMMAND
// ============================================================

const isYouTubePlayCommand = (command = "") => {
  const normalized = normalizeText(command);

  return (
    /^(hey\s+)?(play|listen to|watch|put on)\b/i.test(
      normalized
    ) &&
    !/\b(list|images?|pictures?)\b/i.test(
      normalized
    )
  );
};

// ============================================================
// YOUTUBE SEARCH COMMAND
// ============================================================

const isYouTubeSearchCommand = (command = "") => {
  const normalized = normalizeText(command);

  return (
    /\b(youtube)\b/i.test(normalized) &&
    /\b(search|find|look|show|open)\b/i.test(
      normalized
    )
  );
};

// ============================================================
// CLEAN YOUTUBE QUERY
// ============================================================

const cleanYouTubeQuery = (command = "") => {
  let query = String(command).trim();

  query = query
    .replace(
      /^(hey\s+)?(youtube\s+)?(search|find|look for|look up|show|open)\s+/i,
      ""
    )
    .replace(
      /^(on\s+)?youtube\s+/i,
      ""
    )
    .replace(
      /^(hey\s+)?(play|listen to|watch|put on)\s+/i,
      ""
    )
    .trim();

  return query;
};

// ============================================================
// SERPER IMAGE SEARCH
// ============================================================

const searchImagesWithSerper = async (query) => {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "SERPER_API_KEY is missing"
    );
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
        "Image search failed"
    );
  }

  const items = Array.isArray(data?.images)
    ? data.images
    : [];

  return items
    .map((item, index) => ({
      id: `${Date.now()}-${index}`,

      title:
        item.title ||
        "Image",

      link:
        item.imageUrl ||
        "",

      thumbnailLink:
        item.thumbnailUrl ||
        item.imageUrl ||
        "",

      contextLink:
        item.link ||
        "",

      source:
        item.source ||
        "",

      domain:
        item.domain ||
        "",

      width:
        item.imageWidth ||
        0,

      height:
        item.imageHeight ||
        0,
    }))
    .filter(
      (image) =>
        image.thumbnailLink ||
        image.link
    );
};

// ============================================================
// GOOGLE SEARCH URL
// ============================================================

const createGoogleSearchUrl = (query) => {
  return (
    "https://www.google.com/search?q=" +
    encodeURIComponent(query)
  );
};

// ============================================================
// YOUTUBE SEARCH URL
// ============================================================

const createYouTubeSearchUrl = (query) => {
  return (
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(query)
  );
};

// ============================================================
// SAVE CONVERSATION
// ============================================================

const saveConversation = async (
  userId,
  userMessage,
  assistantMessage
) => {
  if (!userMessage || !assistantMessage) {
    return;
  }

  try {
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          conversationHistory: {
            $each: [
              {
                user: String(userMessage),

                assistant:
                  String(assistantMessage),

                timestamp: new Date(),
              },
            ],

            $slice: -8,
          },
        },
      }
    );
  } catch (error) {
    console.error(
      "Conversation Save Error:",
      error?.message || error
    );
  }
};

// ============================================================
// MAIN ASSISTANT
// ============================================================

export const askToAssistant = async (
  req,
  res
) => {
  const cleanCommand =
    typeof req.body?.command === "string"
      ? req.body.command.trim()
      : "";

  try {
    // ========================================================
    // EMPTY COMMAND
    // ========================================================

    if (!cleanCommand) {
      return res.status(400).json({
        type: "general",
        emotion: "neutral",
        userInput: "",
        riskLevel: "none",
        response: "Please say something.",
      });
    }

    // ========================================================
    // USER
    // ========================================================

    const user = await User.findById(
      req.userId
    );

    if (!user) {
      return res.status(404).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response: "User not found.",
      });
    }

    // ========================================================
    // ASSISTANT INFORMATION
    // ========================================================

    const assistantName =
      user.assistantName ||
      "Lucy";

    const userName =
      user.name ||
      "User";

    // ========================================================
    // HISTORY
    // ========================================================

    const previousHistory =
      Array.isArray(
        user.conversationHistory
      )
        ? user.conversationHistory.slice(-8)
        : [];

    // ========================================================
    // CLEAN COMMAND
    // ========================================================

    const command =
      cleanAssistantName(
        cleanCommand,
        assistantName
      );

    // ========================================================
    // CLOSE YOUTUBE
    // ========================================================

    if (
      isYouTubeCloseCommand(command)
    ) {
      const response =
        "Okay, closing YouTube.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "youtube_close",
        emotion: "neutral",
        userInput: command,
        response,
        riskLevel: "none",
      });
    }

    // ========================================================
    // PAUSE YOUTUBE
    // ========================================================

    if (
      isYouTubePauseCommand(command)
    ) {
      const response =
        "Okay, I've paused the video.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "youtube_pause",
        emotion: "neutral",
        userInput: command,
        response,
        riskLevel: "none",
      });
    }

    // ========================================================
    // RESUME YOUTUBE
    // ========================================================

    if (
      isYouTubeResumeCommand(command)
    ) {
      const response =
        "Sure, continuing the video.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "youtube_resume",
        emotion: "neutral",
        userInput: command,
        response,
        riskLevel: "none",
      });
    }

    // ========================================================
    // CLOSE IMAGES
    // ========================================================

    if (
      isCloseImagesCommand(command)
    ) {
      const response =
        "Okay, closing the images.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "close_images",
        emotion: "neutral",
        userInput: "close images",
        riskLevel: "none",
        response,
      });
    }

    // ========================================================
    // CLOSE LIST
    // ========================================================

    if (
      isCloseListCommand(command)
    ) {
      const response =
        "Okay, closing the list.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "close_list",
        emotion: "neutral",
        userInput: "close list",
        riskLevel: "none",
        response,
      });
    }

    // ========================================================
    // IMAGE SEARCH
    // ========================================================

    if (
      isImageSearchCommand(command)
    ) {
      const imageQuery =
        cleanImageQuery(command);

      try {
        const images =
          await searchImagesWithSerper(
            imageQuery
          );

        const response =
          images.length > 0
            ? `Showing image results for ${imageQuery}.`
            : `I couldn't find images for ${imageQuery}.`;

        await saveConversation(
          user._id,
          cleanCommand,
          response
        );

        return res.status(200).json({
          type: "image_search",
          emotion: "neutral",
          userInput: imageQuery,
          query: imageQuery,
          images,
          response,
          riskLevel: "none",
        });
      } catch (error) {
        console.error(
          "Image Search Error:",
          error?.message || error
        );

        return res.status(200).json({
          type: "image_search",
          emotion: "neutral",
          userInput: imageQuery,
          query: imageQuery,
          images: [],
          response:
            "I couldn't get the image results right now. Please try again in a moment.",
          riskLevel: "none",
        });
      }
    }

    // ========================================================
    // DIRECT YOUTUBE PLAY
    // ========================================================

    if (
      isYouTubePlayCommand(command)
    ) {
      const query =
        cleanYouTubeQuery(command);

      if (query) {
        try {
          const youtubeResult =
            await searchYouTube(query);

          if (
            youtubeResult?.videoId
          ) {
            const response =
              `Playing ${
                youtubeResult.title ||
                query
              } on YouTube.`;

            await saveConversation(
              user._id,
              cleanCommand,
              response
            );

            return res.status(200).json({
              type: "youtube_play",
              emotion: "neutral",
              userInput: query,

              videoId:
                youtubeResult.videoId,

              url:
                youtubeResult.url ||
                `https://www.youtube.com/watch?v=${youtubeResult.videoId}`,

              title:
                youtubeResult.title ||
                query,

              response,
              riskLevel: "none",
            });
          }

          const response =
            `I couldn't find ${query} on YouTube.`;

          await saveConversation(
            user._id,
            cleanCommand,
            response
          );

          return res.status(200).json({
            type: "general",
            emotion: "neutral",
            userInput: query,
            riskLevel: "none",
            response,
          });
        } catch (error) {
          console.error(
            "YouTube Play Error:",
            error?.message || error
          );

          return res.status(200).json({
            type: "general",
            emotion: "neutral",
            userInput: query,
            riskLevel: "none",
            response:
              "I couldn't connect to YouTube right now. Please try again.",
          });
        }
      }
    }

    // ========================================================
    // DIRECT YOUTUBE SEARCH
    // ========================================================

    if (
      isYouTubeSearchCommand(command)
    ) {
      const query =
        cleanYouTubeQuery(command);

      const url =
        createYouTubeSearchUrl(query);

      const response =
        `Searching YouTube for ${query}.`;

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "youtube_search",
        emotion: "neutral",
        userInput: query,
        query,
        url,
        response,
        riskLevel: "none",
      });
    }

    // ========================================================
    // LIST ITEM SELECTION
    // ========================================================

    const isSelectionCommand =
      /\b(play|listen|watch|search|google|find|look up|look for)\b/i.test(
        command
      ) &&
      /\b(\d+|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|item|number|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(
        command
      );

    if (isSelectionCommand) {
      const selection =
        selectListItem({
          command,
          listItems:
            user.activeList?.items || [],
        });

      if (!selection.success) {
        await saveConversation(
          user._id,
          cleanCommand,
          selection.message
        );

        return res.status(200).json({
          type: "general",
          emotion: "neutral",
          userInput: cleanCommand,
          riskLevel: "none",
          response:
            selection.message,
        });
      }

      const item = selection.item;

      // ======================================================
      // PLAY SELECTED ITEM
      // ======================================================

      if (
        selection.action === "play"
      ) {
        try {
          const youtubeResult =
            await searchYouTube(
              item.searchQuery ||
                item.title
            );

          if (
            !youtubeResult?.videoId
          ) {
            return res.status(200).json({
              type: "general",
              emotion: "neutral",
              userInput: cleanCommand,
              riskLevel: "none",
              response:
                `I couldn't find ${item.title} on YouTube.`,
            });
          }

          const response =
            `Playing ${item.title} on YouTube.`;

          await saveConversation(
            user._id,
            cleanCommand,
            response
          );

          return res.status(200).json({
            type: "youtube_play",
            emotion: "neutral",
            userInput: item.title,

            videoId:
              youtubeResult.videoId,

            url:
              youtubeResult.url ||
              `https://www.youtube.com/watch?v=${youtubeResult.videoId}`,

            title:
              youtubeResult.title ||
              item.title,

            response,
            riskLevel: "none",
          });
        } catch (error) {
          console.error(
            "Selected YouTube Play Error:",
            error?.message || error
          );

          return res.status(200).json({
            type: "general",
            emotion: "neutral",
            userInput: cleanCommand,
            riskLevel: "none",
            response:
              "I couldn't connect to YouTube right now.",
          });
        }
      }

      // ======================================================
      // SEARCH SELECTED ITEM
      // ======================================================

      if (
        selection.action === "search"
      ) {
        const query =
          item.searchQuery ||
          item.title;

        const response =
          `Searching for ${item.title}.`;

        await saveConversation(
          user._id,
          cleanCommand,
          response
        );

        return res.status(200).json({
          type: "google_search",
          emotion: "neutral",
          userInput: query,

          url:
            createGoogleSearchUrl(
              query
            ),

          response,
          riskLevel: "none",
        });
      }

      const response =
        `You selected ${item.title}.`;

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response,
      });
    }

    // ========================================================
    // NEW LIST
    // ========================================================

    if (
      isListCommand(command)
    ) {
      try {
        const list =
          await generateList({
            command,
            assistantName,
            userName,
            previousHistory,
          });

        if (
          !list ||
          !Array.isArray(list.items)
        ) {
          throw new Error(
            "Invalid list response"
          );
        }

        await User.findByIdAndUpdate(
          user._id,
          {
            activeList: {
              title:
                list.title ||
                "Results",

              items:
                list.items,

              createdAt:
                new Date(),
            },
          }
        );

        const response =
          list.response ||
          `I found ${list.items.length} items for you.`;

        await saveConversation(
          user._id,
          cleanCommand,
          response
        );

        return res.status(200).json({
          type: "list_results",
          emotion: "neutral",
          riskLevel: "none",
          userInput: command,
          query: command,

          title:
            list.title ||
            "Results",

          items:
            list.items,

          response,
        });
      } catch (error) {
        console.error(
          "List Error:",
          error?.message || error
        );

        return res.status(200).json({
          type: "general",
          emotion: "neutral",
          userInput: cleanCommand,
          riskLevel: "none",
          response:
            "I'm having trouble creating that list right now. Please try again in a moment.",
        });
      }
    }

    // ========================================================
    // GROQ
    // ========================================================

    let result;

    try {
      result =
        await generateResponse(
          command,
          assistantName,
          userName,
          user._id.toString(),
          previousHistory
        );
    } catch (error) {
      console.error(
        "Groq Error:",
        error?.message || error
      );

      return res.status(200).json({
        type: "general",
        emotion: "neutral",
        userInput: cleanCommand,
        riskLevel: "none",
        response:
          "I'm having trouble processing that command right now. Please try again in a moment.",
      });
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    if (
      !result ||
      typeof result !== "object"
    ) {
      result = {
        type: "general",
        userInput: cleanCommand,
        response:
          "I'm here. How can I help?",
        riskLevel: "none",
      };
    }

    // ========================================================
    // GOOGLE SEARCH
    // ========================================================

    if (
      result.type ===
      "google_search"
    ) {
      const query =
        result.userInput ||
        cleanCommand;

      const response =
        result.response ||
        `Searching for ${query}.`;

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "google_search",
        userInput: query,

        url:
          createGoogleSearchUrl(
            query
          ),

        response,

        emotion:
          result.emotion ||
          "neutral",
      });
    }

    // ========================================================
    // YOUTUBE SEARCH FROM GROQ
    // ========================================================

    if (
      result.type ===
      "youtube_search"
    ) {
      const query =
        result.query ||
        result.userInput ||
        cleanCommand;

      const url =
        createYouTubeSearchUrl(
          query
        );

      const response =
        result.response ||
        `Searching YouTube for ${query}.`;

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "youtube_search",
        query,
        userInput: query,
        url,
        response,

        emotion:
          result.emotion ||
          "neutral",
      });
    }

    // ========================================================
    // YOUTUBE PLAY FROM GROQ
    // ========================================================

    if (
      result.type ===
      "youtube_play"
    ) {
      const searchQuery =
        String(
          result.userInput ||
            result.query ||
            cleanCommand
        )
          .replace(
            /^play\s+/i,
            ""
          )
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
          .replace(
            /^on youtube\s+/i,
            ""
          )
          .trim();

      try {
        const youtubeResult =
          await searchYouTube(
            searchQuery
          );

        if (
          !youtubeResult?.videoId
        ) {
          return res.status(200).json({
            type: "general",
            emotion: "neutral",
            userInput: cleanCommand,
            riskLevel: "none",
            response:
              `I couldn't find ${searchQuery} on YouTube.`,
          });
        }

        const response =
          `Playing ${
            youtubeResult.title ||
            searchQuery
          } on YouTube.`;

        await saveConversation(
          user._id,
          cleanCommand,
          response
        );

        return res.status(200).json({
          type: "youtube_play",

          emotion:
            result.emotion ||
            "neutral",

          userInput:
            searchQuery,

          videoId:
            youtubeResult.videoId,

          url:
            youtubeResult.url ||
            `https://www.youtube.com/watch?v=${youtubeResult.videoId}`,

          title:
            youtubeResult.title ||
            searchQuery,

          response,

          riskLevel:
            result.riskLevel ||
            "none",
        });
      } catch (error) {
        console.error(
          "YouTube Groq Play Error:",
          error?.message || error
        );

        return res.status(200).json({
          type: "general",
          emotion: "neutral",
          userInput: cleanCommand,
          riskLevel: "none",
          response:
            "I couldn't connect to YouTube right now. Please try again.",
        });
      }
    }

    // ========================================================
    // GENERAL
    // ========================================================

    if (
      result.type === "general"
    ) {
      const response =
        result.response ||
        "I'm here. How can I help?";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,

        type: "general",

        emotion:
          result.emotion ||
          "neutral",

        response,
      });
    }

    // ========================================================
    // WEATHER
    // ========================================================

    if (
      result.type ===
      "weather_show"
    ) {
      const response =
        result.response ||
        "Showing the weather.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,

        type: "weather_show",

        url:
          result.url ||
          "https://www.google.com/search?q=weather",

        response,

        emotion:
          result.emotion ||
          "neutral",
      });
    }

    // ========================================================
    // TIME
    // ========================================================

    if (
      result.type ===
      "get_time"
    ) {
      const response =
        new Date().toLocaleTimeString(
          "en-IN",
          {
            timeZone:
              "Asia/Kolkata",
          }
        );

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "get_time",
        response,
        emotion: "neutral",
      });
    }

    // ========================================================
    // DATE
    // ========================================================

    if (
      result.type ===
      "get_date"
    ) {
      const response =
        new Date().toLocaleDateString(
          "en-IN",
          {
            timeZone:
              "Asia/Kolkata",
          }
        );

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "get_date",
        response,
        emotion: "neutral",
      });
    }

    // ========================================================
    // DAY
    // ========================================================

    if (
      result.type ===
      "get_day"
    ) {
      const response =
        new Date().toLocaleDateString(
          "en-IN",
          {
            timeZone:
              "Asia/Kolkata",
            weekday:
              "long",
          }
        );

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "get_day",
        response,
        emotion: "neutral",
      });
    }

    // ========================================================
    // MONTH
    // ========================================================

    if (
      result.type ===
      "get_month"
    ) {
      const response =
        new Date().toLocaleDateString(
          "en-IN",
          {
            timeZone:
              "Asia/Kolkata",
            month:
              "long",
          }
        );

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "get_month",
        response,
        emotion: "neutral",
      });
    }

    // ========================================================
    // CALCULATOR
    // ========================================================

    if (
      result.type ===
      "calculator_open"
    ) {
      const response =
        result.response ||
        "Opening the calculator.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,

        type:
          "calculator_open",

        url:
          "https://www.google.com/search?q=calculator",

        response,

        emotion:
          result.emotion ||
          "neutral",
      });
    }

    // ========================================================
    // INSTAGRAM
    // ========================================================

    if (
      result.type ===
      "instagram_open"
    ) {
      const response =
        result.response ||
        "Opening Instagram.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "instagram_open",
        url:
          "https://www.instagram.com/",
        response,

        emotion:
          result.emotion ||
          "neutral",
      });
    }

    // ========================================================
    // FACEBOOK
    // ========================================================

    if (
      result.type ===
      "facebook_open"
    ) {
      const response =
        result.response ||
        "Opening Facebook.";

      await saveConversation(
        user._id,
        cleanCommand,
        response
      );

      return res.status(200).json({
        ...result,
        type: "facebook_open",
        url:
          "https://www.facebook.com/",
        response,

        emotion:
          result.emotion ||
          "neutral",
      });
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    const response =
      result.response ||
      "Done.";

    await saveConversation(
      user._id,
      cleanCommand,
      response
    );

    return res.status(200).json({
      ...result,

      type:
        result.type ||
        "general",

      emotion:
        result.emotion ||
        "neutral",

      response,
    });
  } catch (error) {
    console.error(
      "Assistant Error:",
      error?.message || error
    );

    return res.status(200).json({
      type: "general",
      emotion: "neutral",
      userInput: cleanCommand,
      riskLevel: "none",
      response:
        "I'm having trouble processing that right now. Please try again in a moment.",
    });
  }
};