import { describe, expect, it } from "vitest";
import { shouldBypassCache } from "./cachePolicy";

describe("shouldBypassCache", () => {
  it("never caches OpenAI requests", () => {
    expect(shouldBypassCache("https://api.openai.com/v1/chat/completions")).toBe(true);
    expect(shouldBypassCache("https://api.openai.com/v1/models")).toBe(true);
    expect(shouldBypassCache("https://example.com/")).toBe(false);
  });
});
