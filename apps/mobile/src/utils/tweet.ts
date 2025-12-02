const tweetRegex =
  /(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+)/i;

export const extractTweetUrl = (text: string) => {
  const match = text.match(tweetRegex);
  return match ? match[1] : undefined;
};

export const getTweetIdFromUrl = (url?: string) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/");
    return segments.pop()?.split("?")[0] ?? undefined;
  } catch {
    return undefined;
  }
};

export const formatDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });


