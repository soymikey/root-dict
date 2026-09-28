import { describe, expect, it } from "vitest";
import { classifyInput } from "./classify";

describe("classifyInput", () => {
  it("detects empty input, words, and sentences in both languages", () => {
    expect(classifyInput("   ")).toMatchObject({ kind: "empty" });
    expect(classifyInput("hello")).toMatchObject({ kind: "en-word", direction: "英文单词 → 中文" });
    expect(classifyInput("well-known")).toMatchObject({ kind: "en-word" });
    expect(classifyInput("Hello, world")).toMatchObject({ kind: "en-sentence", direction: "英文 → 中文" });
    expect(classifyInput("苹果")).toMatchObject({ kind: "zh-word", direction: "中文 → 英文候选" });
    expect(classifyInput("你好，今天天气怎么样？")).toMatchObject({ kind: "zh-sentence", direction: "中文 → 英文" });
    expect(classifyInput("我喜欢 apple")).toMatchObject({ kind: "zh-sentence" });
  });
});
