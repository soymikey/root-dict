import { describe, expect, it } from "vitest";
import { pickEnglishVoice, preferAmericanVoice, setPreferAmericanVoice, tokenizeEnglish } from "./pronounce";

describe("pronunciation helpers", () => {
  it("prefers an American voice and falls back to any English voice", () => {
    const voices = [
      { lang: "zh-CN", name: "Tingting" },
      { lang: "en-GB", name: "Daniel" },
      { lang: "en-US", name: "Samantha" },
    ];
    expect(pickEnglishVoice(voices, true)?.name).toBe("Samantha");
    expect(pickEnglishVoice(voices, false)?.name).toBe("Daniel");
    expect(pickEnglishVoice([{ lang: "en-GB", name: "Daniel" }], true)?.name).toBe("Daniel");
    expect(pickEnglishVoice([{ lang: "zh-CN", name: "Tingting" }])).toBeNull();
  });

  it("splits an English sentence into tappable words", () => {
    expect(tokenizeEnglish("Hello, world!")).toEqual([
      { text: "Hello", speakable: true },
      { text: ", ", speakable: false },
      { text: "world", speakable: true },
      { text: "!", speakable: false },
    ]);
  });

  it("remembers the American default without touching the API key", () => {
    localStorage.clear();
    expect(preferAmericanVoice()).toBe(true);
    setPreferAmericanVoice(false);
    expect(preferAmericanVoice()).toBe(false);
    expect(localStorage.getItem("dict.prefer-american")).toBe("0");
  });
});
