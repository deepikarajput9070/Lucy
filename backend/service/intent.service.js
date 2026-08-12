import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const detectIntent = async (command, history = []) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: `
You are an intent classifier for a personal voice assistant.

Return only valid JSON.

Allowed intents:
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
close_images
youtube_pause
youtube_resume
youtube_close

Return:
{
  "intent": "one_allowed_intent",
  "query": "relevant query or empty string"
}
`,
        },
        {
          role: "user",
          content: JSON.stringify({
            command,
            history,
          }),
        },
      ],
    });

    const content =
      response?.choices?.[0]?.message?.content || "{}";

    return JSON.parse(content);
  } catch (error) {
    console.error("Intent Error:", error?.message || error);

    return {
      intent: "general",
      query: command || "",
    };
  }
};