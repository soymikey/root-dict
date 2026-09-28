export function shouldBypassCache(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "api.openai.com" || hostname.endsWith(".openai.com");
  } catch {
    return true;
  }
}
