// ============================================================
// COMMAND UTILS
// ============================================================

// ============================================================
// NORMALIZE TEXT
// ============================================================

export const normalizeText = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ============================================================
// ORDINAL / ITEM NUMBER
// ============================================================

export const getOrdinalNumber = (command = "") => {
  const text = normalizeText(command);

  // ----------------------------------------------------------
  // DIRECT NUMBERS
  // ----------------------------------------------------------
  // Examples:
  // play 2
  // play item 5
  // play number 3
  // search no 4
  // play #2

  const numberMatch = text.match(
    /\b(?:item|number|no|#)?\s*(\d{1,2})\b/i
  );

  if (numberMatch) {
    const number = Number(numberMatch[1]);

    if (number > 0) {
      return number;
    }
  }

  // ----------------------------------------------------------
  // ORDINAL WORDS
  // ----------------------------------------------------------

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

  for (const [word, number] of Object.entries(
    ordinalWords
  )) {
    const regex = new RegExp(
      `\\b${word}\\b`,
      "i"
    );

    if (regex.test(text)) {
      return number;
    }
  }

  // ----------------------------------------------------------
  // CARDINAL WORDS
  // ----------------------------------------------------------
  // Examples:
  // play one
  // play two
  // play five

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
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
  };

  for (const [word, number] of Object.entries(
    numberWords
  )) {
    const regex = new RegExp(
      `\\b${word}\\b`,
      "i"
    );

    if (regex.test(text)) {
      return number;
    }
  }

  // ----------------------------------------------------------
  // ORDINAL NUMBERS
  // ----------------------------------------------------------
  // 1st, 2nd, 3rd, 4th, etc.

  const ordinalMatch = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)\b/i
  );

  if (ordinalMatch) {
    const number = Number(
      ordinalMatch[1]
    );

    if (number > 0) {
      return number;
    }
  }

  return null;
};

// ============================================================
// LIST SELECTION ACTION
// ============================================================

export const getListSelectionAction = (
  command = ""
) => {
  const text = normalizeText(command);

  // ----------------------------------------------------------
  // PLAY
  // ----------------------------------------------------------

  if (
    /\b(play|listen|listen to|put on|watch|resume)\b/i.test(
      text
    )
  ) {
    return "play";
  }

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  if (
    /\b(search|google|find|look up|look for)\b/i.test(
      text
    )
  ) {
    return "search";
  }

  return null;
};

// ============================================================
// DETECT LIST ITEM SELECTION
// ============================================================

export const hasListSelectionCommand = (
  command = ""
) => {
  const text = normalizeText(command);

  const number = getOrdinalNumber(text);

  if (!number) {
    return false;
  }

  const hasSelectionWord =
    /\b(item|number|no|one|two|three|four|five|six|seven|eight|nine|ten|result|choice|option|one)\b/i.test(
      text
    );

  const hasAction =
    /\b(play|listen|search|google|find|watch|open|look up|look for)\b/i.test(
      text
    );

  return (
    hasSelectionWord ||
    hasAction
  );
};

// ============================================================
// CLEAN SEARCH COMMAND
// ============================================================

export const cleanSearchCommand = (
  command = ""
) => {
  return normalizeText(command)
    .replace(
      /^(search|find|google|look up|look for|show me)\s+/i,
      ""
    )
    .trim();
};

// ============================================================
// CLEAN LIST COMMAND
// ============================================================

export const cleanListCommand = (
  command = ""
) => {
  return normalizeText(command)
    .replace(
      /^(give me|show me|list|tell me|name|find|search|recommend)\s+/i,
      ""
    )
    .trim();
};