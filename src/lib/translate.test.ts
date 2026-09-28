import { afterEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, setApiKey } from "./apiKey";
import { OpenAIError, translateInput } from "./translate";

function mockChat(content: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  });
}

describe("translateInput", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearApiKey();
  });

  it("translates an English sentence without putting the key in the request URL or body", async () => {
    const fetchMock = mockChat({ translation: "你好，世界" });
    vi.stubGlobal("fetch", fetchMock);

    const result = await translateInput("sk-test", "Hello, world");

    expect(result).toEqual({
      kind: "sentence",
      sourceLang: "en",
      source: "Hello, world",
      translation: "你好，世界",
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(String(url)).not.toContain("sk-test");
    expect(init.cache).toBe("no-store");
    expect(init.referrerPolicy).toBe("no-referrer");
    expect(init.body).not.toContain("sk-test");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
    setApiKey("unused");
  });

  it("returns several English candidates for a Chinese word", async () => {
    vi.stubGlobal(
      "fetch",
      mockChat({
        candidates: [
          { word: "apple", pos: "n.", gloss: "苹果" },
          { word: "Apple", pos: "n.", gloss: "苹果公司" },
        ],
      }),
    );

    const result = await translateInput("sk-test", "苹果");
    expect(result).toMatchObject({
      kind: "candidates",
      query: "苹果",
      candidates: [{ word: "apple" }, { word: "Apple", gloss: "苹果公司" }],
    });
  });

  it("rejects an invalid payload and an unauthorized key", async () => {
    vi.stubGlobal("fetch", mockChat({ nope: true }));
    await expect(translateInput("sk-test", "hello")).rejects.toBeInstanceOf(OpenAIError);

    vi.stubGlobal("fetch", mockChat({}, 401));
    await expect(translateInput("sk-bad", "hello")).rejects.toMatchObject({ message: "API 密钥无效" });
  });
});
