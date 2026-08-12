import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
  "list_results",
  "close_list",
];

const VALID_RISKS = [
  "none",
  "low",
  "medium",
  "high",
];

const cleanJsonResponse = (
  text = ""
) => {
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

const createFallback = (
  command,
  response = "I'm here. How can I help?"
) => {
  return {
    type: "general",
    userInput: command || "",
    response,
    riskLevel: "none",
  };
};

const validateResult = (
  result,
  command
) => {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return createFallback(command);
  }

  if (!VALID_TYPES.includes(result.type)) {
    result.type = "general";
  }

  if (
    !VALID_RISKS.includes(
      result.riskLevel
    )
  ) {
    result.riskLevel = "none";
  }

  if (
    typeof result.userInput !== "string" ||
    !result.userInput.trim()
  ) {
    result.userInput = command;
  }

  if (
    typeof result.response !== "string" ||
    !result.response.trim()
  ) {
    result.response =
      "I'm here. How can I help?";
  }

  const finalResult = {
    type: result.type,
    userInput:
      result.userInput.trim(),
    response:
      result.response.trim(),
    riskLevel:
      result.riskLevel,
  };

  if (
    result.type === "list_results"
  ) {
    finalResult.title =
      typeof result.title === "string"
        ? result.title
        : "Results";

    finalResult.items =
      Array.isArray(result.items)
        ? result.items
        : [];
  }

  if (
    result.type === "image_search"
  ) {
    finalResult.query =
      typeof result.query === "string"
        ? result.query
        : result.userInput;

    finalResult.images =
      Array.isArray(result.images)
        ? result.images
        : [];
  }

  if (
    result.type === "youtube_play"
  ) {
    if (
      typeof result.videoId === "string"
    ) {
      finalResult.videoId =
        result.videoId;
    }

    if (
      typeof result.url === "string"
    ) {
      finalResult.url =
        result.url;
    }

    if (
      typeof result.title === "string"
    ) {
      finalResult.title =
        result.title;
    }
  }

  if (
    typeof result.url === "string"
  ) {
    finalResult.url = result.url;
  }

  return finalResult;
};

const buildSystemPrompt = ({
  assistantName,
  userName,
  currentTime,
  history,
  cleanedCommand,
}) => {
  return `
You are ${assistantName}, a highly capable personal voice assistant for ${userName}.

Your job is to understand the user's intent and return exactly ONE valid JSON object.

Assistant name:
${assistantName}

User:
${userName}

Current India time:
${currentTime}

Recent conversation:
${history}

Current command:
${cleanedCommand}

Use the recent conversation to resolve references such as:

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
the first one
the second one
the previous one
the next one

The latest user correction always wins.

Return ONLY ONE JSON OBJECT.

Never return:
- arrays
- multiple JSON objects
- Markdown
- code fences
- comments
- explanations outside JSON
- hidden reasoning
- emotion
- confidence

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
- programming
- mathematics
- science
- education
- explanations
- reasoning
- casual conversation
- problem solving

Use google_search when the user asks to:
- search Google
- search online
- browse the internet
- look something up
- find current information

Use image_search for image, picture, photo, pic or wallpaper requests.

Use youtube_play when the user wants something played, watched or listened to.

Use youtube_search when the user specifically requests YouTube search results.

Use weather_show for weather.

Use get_time for current time.

Use get_date for today's date.

Use get_day for today's weekday.

Use get_month for the current month.

Use calculator_open ONLY when explicitly asked to open a calculator.

Use instagram_open only when explicitly asked to open Instagram.

Use facebook_open only when explicitly asked to open Facebook.

Use list_results for requests involving:
- top items
- best items
- recommendations
- rankings
- multiple results
- top 5
- top 10
- lists

List format:

{
  "type": "list_results",
  "userInput": "top 5 laptops",
  "response": "Here are the results.",
  "riskLevel": "none",
  "title": "Top 5 Laptops",
  "items": [
    {
      "number": 1,
      "title": "Example",
      "description": "Example description",
      "searchQuery": "Example search"
    }
  ]
}

For closing a list:

{
  "type": "close_list",
  "userInput": "close list",
  "response": "Closing the list.",
  "riskLevel": "none"
}

Do not falsely claim that an external action has already happened.

The frontend performs external actions.

Keep responses concise and natural.

Do not diagnose medical conditions.

Do not prescribe medication.

Do not encourage dangerous or illegal behavior.

Return exactly one JSON object.

Current command:

${cleanedCommand}
`;
};

const formatHistory = (
  history = []
) => {
  if (
    !Array.isArray(history) ||
    history.length === 0
  ) {
    return "No previous conversation.";
  }

  return history
    .map((item, index) => {
      return `Conversation ${index + 1}
User: ${item.userMessage || item.user || ""}
Assistant: ${item.assistantMessage || item.assistant || ""}
Intent: ${item.intent || "general"}`;
    })
    .join("\n\n");
};

const removeWakeWord = (
  command,
  assistantName
) => {
  const normalized =
    String(command || "")
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const name =
    String(
      assistantName || "Lucy"
    )
      .toLowerCase()
      .trim();

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
    normalized.startsWith("lucy ")
  ) {
    return normalized
      .slice(5)
      .trim();
  }

  return normalized;
};

const generateResponse = async (
  command,
  assistantName = "Lucy",
  userName = "User",
  userId = "default",
  previousHistory = []
) => {
  try {
    const originalCommand =
      String(command || "").trim();

    if (!originalCommand) {
      return createFallback(
        "",
        "Yes? What would you like me to do?"
      );
    }

    const cleanedCommand =
      removeWakeWord(
        originalCommand,
        assistantName
      );

    if (!cleanedCommand) {
      return createFallback(
        originalCommand,
        "Yes? What would you like me to do?"
      );
    }

    const history =
      formatHistory(
        previousHistory
      );

    const currentTime =
      new Date().toLocaleString(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",
        }
      );

    const systemPrompt =
      buildSystemPrompt({
        assistantName,
        userName,
        currentTime,
        history,
        cleanedCommand,
      });

    const completion =
      await groq.chat.completions.create({
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
            content: systemPrompt,
          },
          {
            role: "user",
            content: cleanedCommand,
          },
        ],
      });

    const raw =
      completion
        ?.choices?.[0]
        ?.message?.content || "";

    const cleaned =
      cleanJsonResponse(raw);

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch {
      result = createFallback(
        originalCommand,
        "I'm sorry, I couldn't process that."
      );
    }

    return validateResult(
      result,
      originalCommand
    );
  } catch (error) {
    console.error(
      "Groq Error:",
      error?.message || error
    );

    return createFallback(
      command,
      "I'm having trouble processing that right now."
    );
  }
};

export default generateResponse;