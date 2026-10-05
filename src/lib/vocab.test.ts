import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { parseStory } from "./story";
import { deleteSavedWord, getSavedWord, listSavedWords, saveWord, setSavedMastery, updateSavedStory } from "./vocab";

const story = parseStory(
  {
    gloss: "苹果",
    ipa: "/ˈæp.əl/",
    pos: "n.",
    forms: [{ label: "复数", value: "apples" }],
    prefix: { text: "", meaning: "" },
    root: { text: "apple", meaning: "苹果" },
    suffix: { text: "", meaning: "" },
    etymologyConfidence: "uncertain",
    etymologyOrigin: "词源不确定。",
    etymologyEvolution: "现在指水果。",
    family: [{ word: "pineapple", gloss: "菠萝" }],
    synonyms: [{ word: "pome", distinction: "植物学用语。" }],
    examples: [{ en: "She ate an apple.", zh: "她吃了一个苹果。" }],
    mnemonic: "想象苹果。",
  },
  "Apple",
);

describe("vocab store", () => {
  beforeEach(async () => {
    const request = indexedDB.deleteDatabase("root-dict");
    await new Promise((resolve) => {
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => resolve(undefined);
      request.onblocked = () => resolve(undefined);
    });
  });

  it("saves a word once, then updates, filters, and deletes it", async () => {
    expect(await saveWord(story)).toBe("saved");
    expect(await saveWord(story)).toBe("duplicate");
    expect((await getSavedWord("apple"))?.story.gloss).toBe("苹果");
    expect((await listSavedWords()).map((item) => item.id)).toEqual(["apple"]);

    await updateSavedStory("apple", { ...story, gloss: "苹果水果" });
    expect((await getSavedWord("APPLE"))?.story.gloss).toBe("苹果水果");

    await setSavedMastery("apple", "mastered");
    expect((await getSavedWord("apple"))?.mastery).toBe("mastered");

    await deleteSavedWord("apple");
    expect(await getSavedWord("apple")).toBeNull();
  });
});
