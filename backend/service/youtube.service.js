// ============================================================
// YOUTUBE SERVICE
// ============================================================

// ============================================================
// GET API KEY
// ============================================================

const getApiKey = () => {
  return process.env.YOUTUBE_API_KEY;
};

// ============================================================
// SEARCH YOUTUBE
// ============================================================

export const searchYouTube = async (
  query,
  maxResults = 1
) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY is missing"
    );
  }

  if (!query || !query.trim()) {
    return null;
  }

  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    `?part=snippet` +
    `&type=video` +
    `&maxResults=${Math.min(
      Number(maxResults) || 1,
      50
    )}` +
    `&q=${encodeURIComponent(
      query
    )}` +
    `&key=${apiKey}`;

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "YouTube search failed"
    );
  }

  if (
    !Array.isArray(
      data?.items
    ) ||
    data.items.length === 0
  ) {
    return null;
  }

  const videos =
    data.items
      .filter(
        (item) =>
          item?.id?.videoId
      )
      .map((item) => ({
        videoId:
          item.id.videoId,

        title:
          item.snippet?.title ||
          query,

        description:
          item.snippet
            ?.description ||
          "",

        channelTitle:
          item.snippet
            ?.channelTitle ||
          "",

        thumbnail:
          item.snippet
            ?.thumbnails
            ?.high?.url ||
          item.snippet
            ?.thumbnails
            ?.medium?.url ||
          item.snippet
            ?.thumbnails
            ?.default?.url ||
          "",

        url:
          `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));

  if (maxResults === 1) {
    return videos[0] || null;
  }

  return videos;
};

// ============================================================
// GET SPECIFIC VIDEO
// ============================================================

export const getYouTubeVideo = async (
  videoId
) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY is missing"
    );
  }

  if (!videoId) {
    return null;
  }

  const url =
    "https://www.googleapis.com/youtube/v3/videos" +
    `?part=snippet,contentDetails` +
    `&id=${encodeURIComponent(
      videoId
    )}` +
    `&key=${apiKey}`;

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "Could not get YouTube video"
    );
  }

  const video =
    data?.items?.[0];

  if (!video) {
    return null;
  }

  return {
    videoId,

    title:
      video.snippet?.title ||
      "YouTube video",

    description:
      video.snippet
        ?.description ||
      "",

    channelTitle:
      video.snippet
        ?.channelTitle ||
      "",

    thumbnail:
      video.snippet
        ?.thumbnails
        ?.high?.url ||
      video.snippet
        ?.thumbnails
        ?.medium?.url ||
      video.snippet
        ?.thumbnails
        ?.default?.url ||
      "",

    url:
      `https://www.youtube.com/watch?v=${videoId}`,
  };
};