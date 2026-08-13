import generateResponse from "../groq.js";
const searchWeb = async (
  query
) => {
  const apiKey =
    process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn(
      "SERPER_API_KEY is missing."
    );

    return [];
  }

  try {
    const response =
      await fetch(
        "https://google.serper.dev/search",
        {
          method: "POST",

          headers: {
            "X-API-KEY":
              apiKey,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            q: query,
            num: 10,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Serper error:",
        data
      );

      return [];
    }

    return Array.isArray(
      data?.organic
    )
      ? data.organic
      : [];

  } catch (error) {
    console.error(
      "List web search error:",
      error
    );

    return [];
  }
};
const searchImages = async (
  query
) => {
  const apiKey =
    process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn(
      "SERPER_API_KEY is missing."
    );

    return [];
  }

  try {
    const response =
      await fetch(
        "https://google.serper.dev/images",
        {
          method: "POST",

          headers: {
            "X-API-KEY":
              apiKey,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            q: query,
            num: 5,
            safe: "active",
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "Serper image error:",
        data
      );

      return [];
    }

    return Array.isArray(
      data?.images
    )
      ? data.images
      : [];

  } catch (error) {
    console.error(
      "List image search error:",
      error
    );

    return [];
  }
};
const getItemImage = async (
  item
) => {
  const query =
    item.searchQuery ||
    item.title ||
    "";

  if (!query.trim()) {
    return {
      image: "",
      thumbnail: "",
      contextLink: "",
      source: "",
    };
  }

  const images =
    await searchImages(
      query
    );

  const image =
    images?.[0];

  if (!image) {
    return {
      image: "",
      thumbnail: "",
      contextLink: "",
      source: "",
    };
  }

  return {
    image:
      image.imageUrl ||
      "",

    thumbnail:
      image.thumbnailUrl ||
      image.imageUrl ||
      "",

    contextLink:
      image.link ||
      "",

    source:
      image.source ||
      image.domain ||
      "",
  };
};
const extractJson = (
  result
) => {
  if (!result) {
    return null;
  }

  if (
    typeof result ===
    "object"
  ) {
    return result;
  }

  try {
    return JSON.parse(
      result
    );
  } catch {
    const cleaned =
      String(result)
        .replace(
          /```json/gi,
          ""
        )
        .replace(
          /```/g,
          ""
        )
        .trim();

    try {
      return JSON.parse(
        cleaned
      );
    } catch {
      return null;
    }
  }
};
export const isListCommand = (
  command = ""
) => {
  const text =
    String(command)
      .toLowerCase()
      .replace(
        /[.,!?]/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  const hasListKeyword =
    /\b(top|best|list|give me|show me|recommend|name|popular|greatest|famous)\b/i.test(
      text
    );

  const hasNumber =
    /\b\d+\b/.test(
      text
    );

  return (
    hasListKeyword &&
    hasNumber
  );
};
export const generateList =
  async ({
    command,
    assistantName,
    userName,
    userId,
  }) => {
    const webResults =
      await searchWeb(
        command
      );

    const webContext =
      webResults
        .slice(0, 10)
        .map(
          (
            item,
            index
          ) =>
            `${index + 1}. ${
              item.title || ""
            } - ${
              item.snippet || ""
            } - ${
              item.link || ""
            }`
        )
        .join("\n");
    const prompt = `
You are generating a useful numbered list for a voice assistant.

User request:
${command}

Web information:
${
  webContext ||
  "No web results available."
}

Create a useful numbered list appropriate for the user's request.

Rules:

- Return ONLY valid JSON.
- Do not use markdown.
- Maximum 20 items.
- Respect the number requested by the user whenever possible.
- Each item must contain:
  number
  title
  description
  searchQuery
- number must be sequential starting at 1.
- searchQuery must be suitable for Google or YouTube search.
- Keep descriptions short.
- If the request asks for top/best/popular items, rank them.
- Use the web information when appropriate.
- If web information is insufficient, use general knowledge.
- For songs, movies, videos, people, places, products or other visual subjects, make searchQuery specific enough to find a representative image.
- Do not add explanations outside the JSON.

JSON format:

{
  "title": "List title",
  "items": [
    {
      "number": 1,
      "title": "Item title",
      "description": "Short description",
      "searchQuery": "specific search query"
    }
  ],
  "response": "I found the list for you."
}
`;
    const result =
      await generateResponse(
        prompt,
        assistantName,
        userName,
        userId
      );

    const parsed =
      extractJson(
        result
      );

    if (
      !parsed ||
      !Array.isArray(
        parsed.items
      )
    ) {
      throw new Error(
        "Could not generate a valid list"
      );
    }
    const basicItems =
      parsed.items
        .slice(0, 20)
        .map(
          (
            item,
            index
          ) => ({
            number:
              index + 1,

            title:
              item.title ||
              `Item ${index + 1}`,

            description:
              item.description ||
              "",

            searchQuery:
              item.searchQuery ||
              item.title ||
              "",
          })
        );
    const itemsWithImages =
      await Promise.all(
        basicItems.map(
          async (item) => {
            const imageData =
              await getItemImage(
                item
              );

            return {
              ...item,

              image:
                imageData.image,

              thumbnail:
                imageData.thumbnail,

              contextLink:
                imageData.contextLink,

              source:
                imageData.source,
            };
          }
        )
      );
    return {
      title:
        parsed.title ||
        "Results",

      items:
        itemsWithImages,

      response:
        parsed.response ||
        `I found ${itemsWithImages.length} items for you.`,
    };
  };
export const selectListItem =
  ({
    command,
    listItems,
  }) => {

    if (
      !Array.isArray(
        listItems
      ) ||
      listItems.length === 0
    ) {
      return {
        success: false,

        message:
          "There isn't an active list to choose from.",
      };
    }

    const text =
      String(command)
        .toLowerCase()
        .replace(
          /[.,!?]/g,
          ""
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    let number = null;
    const numberMatch =
      text.match(
        /\b(?:item|number|no|#)?\s*(\d{1,2})\b/i
      );

    if (numberMatch) {
      number =
        Number(
          numberMatch[1]
        );
    }
    if (!number) {
      const ordinalWords = {
        first: 1,
        second: 2,
        third: 3,
        fourth: 4,
        fifth: 5,
        sixth: 6,
        seventh: 7,
        eighth: 8,
        ninth: 9,
        tenth: 10,
        eleventh: 11,
        twelfth: 12,
        thirteenth: 13,
        fourteenth: 14,
        fifteenth: 15,
        sixteenth: 16,
        seventeenth: 17,
        eighteenth: 18,
        nineteenth: 19,
        twentieth: 20,
      };

      for (
        const [
          word,
          value,
        ] of Object.entries(
          ordinalWords
        )
      ) {
        if (
          new RegExp(
            `\\b${word}\\b`,
            "i"
          ).test(text)
        ) {
          number =
            value;

          break;
        }
      }
    }
    if (!number) {
      const numberWords = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
      };

      for (
        const [
          word,
          value,
        ] of Object.entries(
          numberWords
        )
      ) {
        if (
          new RegExp(
            `\\b${word}\\b`,
            "i"
          ).test(text)
        ) {
          number =
            value;

          break;
        }
      }
    }
    if (!number) {
      const ordinalMatch =
        text.match(
          /\b(\d{1,2})(?:st|nd|rd|th)\b/i
        );

      if (ordinalMatch) {
        number =
          Number(
            ordinalMatch[1]
          );
      }
    }
    if (!number) {
      return {
        success: false,

        message:
          "I couldn't determine which item you meant.",
      };
    }
    const item =
      listItems[
        number - 1
      ];

    if (!item) {
      return {
        success: false,

        message:
          `There is no item ${number} in the current list.`,
      };
    }
    let action = null;

    if (
      /\b(play|listen|put on|watch|resume)\b/i.test(
        text
      )
    ) {
      action = "play";
    } else if (
      /\b(search|google|find|look up|look for)\b/i.test(
        text
      )
    ) {
      action = "search";
    }

    return {
      success: true,

      action:
        action || "select",

      item,
    };
  };
export const cleanListCommand = (
  command = ""
) => {
  return String(command)
    .toLowerCase()
    .replace(
      /[.,!?]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .replace(
      /^(give me|show me|list|tell me|name|find|search|recommend)\s+/i,
      ""
    )
    .trim();
};