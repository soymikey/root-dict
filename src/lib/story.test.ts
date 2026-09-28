import { describe, expect, it } from "vitest";
import { parseStory } from "./story";

const valid = {
  gloss: "苹果",
  ipa: "/ˈæp.əl/",
  pos: "n.",
  forms: [{ label: "复数", value: "apples" }],
  prefix: { text: "", meaning: "" },
  root: { text: "apple", meaning: "苹果" },
  suffix: { text: "", meaning: "" },
  etymologyConfidence: "uncertain",
  etymologyOrigin: "具体早期词源路径不确定。",
  etymologyEvolution: "现代英语中主要指苹果。",
  family: [{ word: "pineapple", gloss: "菠萝" }],
  synonyms: [{ word: "pome", distinction: "pome 是植物学用语，日常很少用。" }],
  examples: [{ en: "She ate an apple.", zh: "她吃了一个苹果。" }],
  mnemonic: "想象一个苹果滚进记忆抽屉。",
};

describe("parseStory", () => {
  it("keeps uncertain etymology separate from the mnemonic", () => {
    const story = parseStory(valid, "apple");
    expect(story.etymology.confidence).toBe("uncertain");
    expect(story.etymology.origin).toMatch(/不确定/);
    expect(story.mnemonic).toMatch(/苹果/);
    expect(story.word).toBe("apple");
  });

  it("rejects a story that invents confidence outside the two allowed values", () => {
    expect(() => parseStory({ ...valid, etymologyConfidence: "maybe" }, "apple")).toThrow();
  });
});
