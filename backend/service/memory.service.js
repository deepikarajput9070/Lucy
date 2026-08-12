import Memory from "../models/memory.model.js";

export const getRecentMemory = async (userId, limit = 8) => {
  if (!userId) return [];

  const memories = await Memory.find({
    user: userId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return memories.reverse();
};

export const saveMemory = async (
  userId,
  userMessage,
  assistantMessage,
  intent = "general"
) => {
  if (!userId || !userMessage || !assistantMessage) {
    return null;
  }

  return await Memory.create({
    user: userId,
    userMessage: String(userMessage),
    assistantMessage: String(assistantMessage),
    intent: String(intent),
  });
};

export const clearMemory = async (userId) => {
  if (!userId) return;

  await Memory.deleteMany({
    user: userId,
  });
};