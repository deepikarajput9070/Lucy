import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ==========================================================
// MEMORY
// ==========================================================

const conversationMemory = new Map();

const MAX_HISTORY = 8;

// ==========================================================
// VALID TYPES
// ==========================================================

const VALID_TYPES = [
  "general",
  "google_search",
  "image_search",
  "youtube_search",
  "youtube_play",
  "weather_show",
  "get_time",
  "get_date",
  "get_day",
  "get_month",
  "calculator_open",
  "instagram_open",
  "facebook_open",

  // List
  "list_results",
  "close_list",
];

// ==========================================================
// VALID RISKS
// ==========================================================

const VALID_RISKS = [
  "none",
  "low",
  "medium",
  "high",
];

// ==========================================================
// CLEAN GROQ JSON
// ==========================================================

const cleanJsonResponse = (text = "") => {
  let cleaned = String(text).trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstObject =
    cleaned.indexOf("{");

  const lastObject =
    cleaned.lastIndexOf("}");

  if (
    firstObject !== -1 &&
    lastObject !== -1 &&
    lastObject > firstObject
  ) {
    return cleaned.slice(
      firstObject,
      lastObject + 1
    );
  }

  return cleaned;
};

// ==========================================================
// MEMORY
// ==========================================================

const getMemory = (userId) => {
  const id =
    userId?.toString() || "default";

  if (!conversationMemory.has(id)) {
    conversationMemory.set(id, []);
  }

  return conversationMemory.get(id);
};

const saveMemory = (
  userId,
  userMessage,
  assistantResponse
) => {
  const id =
    userId?.toString() || "default";

  const memory =
    getMemory(id);

  memory.push({
    user:
      String(userMessage || ""),

    assistant:
      String(
        assistantResponse || ""
      ),
  });

  while (
    memory.length >
    MAX_HISTORY
  ) {
    memory.shift();
  }

  conversationMemory.set(
    id,
    memory
  );
};

const formatHistory = (
  memory
) => {
  if (
    !memory ||
    memory.length === 0
  ) {
    return "No previous conversation.";
  }

  return memory
    .map(
      (item, index) =>
        `Conversation ${index + 1}
User: ${item.user}
Assistant: ${item.assistant}`
    )
    .join("\n\n");
};

// ==========================================================
// NORMALIZE TEXT
// ==========================================================

const normalizeText = (
  text = ""
) => {
  return String(text)
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ==========================================================
// REMOVE WAKE WORD
// ==========================================================

const removeWakeWord = (
  command,
  assistantName
) => {
  const normalized =
    normalizeText(command);

  const name =
    normalizeText(
      assistantName || "Lucy"
    );

  if (normalized === name) {
    return "";
  }

  if (
    normalized.startsWith(
      `${name} `
    )
  ) {
    return normalized
      .slice(name.length)
      .trim();
  }

  if (
    normalized.startsWith(
      "lucy "
    )
  ) {
    return normalized
      .slice(5)
      .trim();
  }

  return normalized;
};

// ==========================================================
// FALLBACK
// ==========================================================

const createFallback = (
  command,
  response = "I'm here. How can I help?"
) => {
  return {
    type: "general",

    userInput:
      command || "",

    response,

    riskLevel: "none",
  };
};

// ==========================================================
// VALIDATE RESULT
// ==========================================================

const validateResult = (
  result,
  command
) => {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return createFallback(
      command
    );
  }

  // TYPE

  if (
    !VALID_TYPES.includes(
      result.type
    )
  ) {
    result.type =
      "general";
  }

  // RISK

  if (
    !VALID_RISKS.includes(
      result.riskLevel
    )
  ) {
    result.riskLevel =
      "none";
  }

  // USER INPUT

  if (
    typeof result.userInput !==
      "string" ||
    !result.userInput.trim()
  ) {
    result.userInput =
      command;
  }

  // RESPONSE

  if (
    typeof result.response !==
      "string" ||
    !result.response.trim()
  ) {
    result.response =
      "I'm here. How can I help?";
  }

  const finalResult = {
    type:
      result.type,

    userInput:
      result.userInput.trim(),

    response:
      result.response.trim(),

    riskLevel:
      result.riskLevel,
  };

  // ========================================================
  // LIST
  // ========================================================

  if (
    result.type ===
    "list_results"
  ) {
    finalResult.title =
      typeof result.title ===
      "string"
        ? result.title
        : "Results";

    finalResult.items =
      Array.isArray(
        result.items
      )
        ? result.items
        : [];
  }

  // ========================================================
  // IMAGE SEARCH
  // ========================================================

  if (
    result.type ===
    "image_search"
  ) {
    finalResult.query =
      typeof result.query ===
      "string"
        ? result.query
        : result.userInput;

    finalResult.images =
      Array.isArray(
        result.images
      )
        ? result.images
        : [];
  }

  // ========================================================
  // YOUTUBE
  // ========================================================

  if (
    result.type ===
    "youtube_play"
  ) {
    if (
      typeof result.videoId ===
      "string"
    ) {
      finalResult.videoId =
        result.videoId;
    }

    if (
      typeof result.url ===
      "string"
    ) {
      finalResult.url =
        result.url;
    }

    if (
      typeof result.title ===
      "string"
    ) {
      finalResult.title =
        result.title;
    }
  }

  // ========================================================
  // URL
  // ========================================================

  if (
    typeof result.url ===
    "string"
  ) {
    finalResult.url =
      result.url;
  }

  return finalResult;
};

// ==========================================================
// SYSTEM PROMPT
// ==========================================================

const buildSystemPrompt = ({
  assistantName,
  userName,
  currentTime,
  history,
  cleanedCommand,
}) => {
  return `
You are ${assistantName}, a highly capable personal voice assistant for ${userName}.

Your job is to understand the user's intent and return EXACTLY ONE valid JSON OBJECT.

You are a conversational assistant, reasoning assistant, search assistant, media assistant and problem-solving assistant.

Assistant name:
${assistantName}

User:
${userName}

Current India time:
${currentTime}

Recent conversation:
${history}

Return ONLY ONE JSON OBJECT.

NEVER return:
- an array
- multiple JSON objects
- Markdown
- code fences
- explanations outside JSON
- comments
- hidden reasoning

The response MUST be valid JSON.

Allowed types:

general
google_search
image_search
youtube_search
youtube_play
weather_show
get_time
get_date
get_day
get_month
calculator_open
instagram_open
facebook_open
list_results
close_list

Allowed risk levels:

none
low
medium
high

Use general for:

- normal questions
- explanations
- programming
- mathematics
- science
- reasoning
- education
- problem solving
- casual conversation

Example:

{
  "type": "general",
  "userInput": "what is Python",
  "response": "Python is a programming language used for many types of software development.",
  "riskLevel": "none"
}

Use google_search when the user explicitly asks to:

- search online
- search Google
- look something up
- browse the web
- find current information
- search the internet

Use image_search for:

- images
- pictures
- photos
- pics
- wallpapers
- visual results

Do NOT use google_search for image-only requests.

Use youtube_play when the user wants something played or watched.

Use youtube_search when the user specifically asks for YouTube search results but does not ask to play.

Use weather_show for weather requests.

Use get_time for current time.

Use get_date for today's date.

Use get_day for today's weekday.

Use get_month for current month.

Use calculator_open ONLY when the user explicitly asks to OPEN calculator.

Normal mathematical questions use general.

Use instagram_open only when the user explicitly asks to open Instagram.

Use facebook_open only when the user explicitly asks to open Facebook.

LISTS:

If the user asks for:
- top items
- best items
- recommendations
- multiple results
- ranked results
- top 5
- top 10
- a list

you may use list_results.

List response format:

{
  "type": "list_results",
  "userInput": "top 5 Hindi songs",
  "response": "Here are the top 5 Hindi song results.",
  "riskLevel": "none",
  "title": "Top 5 Hindi Songs",
  "items": [
    {
      "number": 1,
      "title": "Example",
      "description": "Example description",
      "searchQuery": "example search"
    }
  ]
}

The entire response must be ONE object.

Never return an array as the top-level response.

For:

close list
close the list
hide list
close results
hide results

return:

{
  "type": "close_list",
  "userInput": "close list",
  "response": "Closing the list.",
  "riskLevel": "none"
}

Use conversation history to resolve:

it
that
this
them
those
again
same
another
more
continue
resume
the song
the video
the image
the images
the list

If the user corrects themselves, the correction wins.

The assistant name is ${assistantName}.

If the command begins with the assistant name, treat it as wake word.

Speech recognition may contain obvious mistakes.

Understand obvious errors whenever possible.

Do not encourage dangerous, illegal or harmful behavior.

Do not diagnose medical conditions.

Do not prescribe medication.

Responses are spoken by a voice assistant.

Keep responses concise and natural.

Do not claim that an external action has already happened.

The frontend performs external actions.

Before responding:

1. Return exactly ONE JSON OBJECT.
2. Never return an array as the top-level response.
3. Use only allowed type.
4. Use only allowed riskLevel.
5. Image requests use image_search.
6. YouTube play requests use youtube_play.
7. YouTube search requests use youtube_search.
8. Normal questions use general.
9. Top/list requests may use list_results.
10. List items must be inside the JSON object.
11. Use conversation history.
12. Resolve pronouns when possible.
13. No Markdown.
14. No code fences.
15. No hidden reasoning.
16. No emotion field.
17. No confidence field.
18. No extra text.
19. Do not falsely claim external actions are completed.

User command:

${cleanedCommand}
`;
};

// ==========================================================
// MAIN GROQ FUNCTION
// ==========================================================

const generateResponse = async (
  command,
  assistantName = "Lucy",
  userName = "User",
  userId = "default"
) => {
  try {
    const originalCommand =
      String(
        command || ""
      ).trim();

    // ======================================================
    // EMPTY
    // ======================================================

    if (!originalCommand) {
      return createFallback(
        "",
        "Yes? What would you like me to do?"
      );
    }

    // ======================================================
    // MEMORY
    // ======================================================

    const memory =
      getMemory(userId);

    const history =
      formatHistory(
        memory
      );

    // ======================================================
    // TIME
    // ======================================================

    const currentTime =
      new Date().toLocaleString(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",
        }
      );

    // ======================================================
    // REMOVE WAKE WORD
    // ======================================================

    const cleanedCommand =
      removeWakeWord(
        originalCommand,
        assistantName
      );

    // ======================================================
    // ONLY WAKE WORD
    // ======================================================

    if (!cleanedCommand) {
      const result =
        createFallback(
          originalCommand,
          "Yes? What would you like me to do?"
        );

      saveMemory(
        userId,
        originalCommand,
        result.response
      );

      return result;
    }

    // ======================================================
    // SYSTEM PROMPT
    // ======================================================

    const systemPrompt =
      buildSystemPrompt({
        assistantName,
        userName,
        currentTime,
        history,
        cleanedCommand,
      });

    // ======================================================
    // GROQ
    // ======================================================

    const completion =
      await groq.chat.completions.create(
        {
          model:
            "llama-3.1-8b-instant",

          temperature: 0.1,

          max_tokens: 1200,

          response_format: {
            type: "json_object",
          },

          messages: [
            {
              role: "system",
              content:
                systemPrompt,
            },
            {
              role: "user",
              content:
                cleanedCommand,
            },
          ],
        }
      );

    // ======================================================
    // RAW
    // ======================================================

    const raw =
      completion
        ?.choices?.[0]
        ?.message?.content || "";

    // ======================================================
    // CLEAN
    // ======================================================

    const cleaned =
      cleanJsonResponse(
        raw
      );

    // ======================================================
    // PARSE
    // ======================================================

    let result;

    try {
      result =
        JSON.parse(
          cleaned
        );
    } catch (error) {
      console.error(
        "Groq JSON parse error"
      );

      result =
        createFallback(
          originalCommand,
          "I'm sorry, I couldn't process that."
        );
    }

    // ======================================================
    // VALIDATE
    // ======================================================

    result =
      validateResult(
        result,
        originalCommand
      );

    // ======================================================
    // SAVE MEMORY
    // ======================================================

    saveMemory(
      userId,
      originalCommand,
      result.response
    );

    return result;

  } catch (error) {
    console.error(
      "Groq Error:",
      error?.message ||
        error
    );

    return createFallback(
      command,
      "I'm having trouble processing that right now."
    );
  }
};

export default generateResponse;