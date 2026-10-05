import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { parseStory } from "../lib/story";
import { saveWord } from "../lib/vocab";
import { VocabPage } from "./VocabPage";

const story = parseStory(
  {
    gloss: "苹果",
    ipa: "/ˈæp.əl/",
    pos: "n.",
    forms: [],
    prefix: { text: "", meaning: "" },
    root: { text: "apple", meaning: "苹果" },
    suffix: { text: "", meaning: "" },
    etymologyConfidence: "confirmed",
    etymologyOrigin: "来自古英语。",
    etymologyEvolution: "现在指水果。",
    family: [{ word: "pineapple", gloss: "菠萝" }],
    synonyms: [{ word: "pome", distinction: "较少用于日常。" }],
    examples: [{ en: "An apple.", zh: "一个苹果。" }],
    mnemonic: "苹果。",
  },
  "apple",
);

describe("VocabPage", () => {
  beforeEach(async () => {
    const request = indexedDB.deleteDatabase("root-dict");
    await new Promise((resolve) => {
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => resolve(undefined);
    });
  });

  it("searches, marks a word mastered, and deletes it", async () => {
    const user = userEvent.setup();
    const onOpenWord = vi.fn();
    await saveWord(story);
    render(<VocabPage onOpenWord={onOpenWord} />);

    expect(await screen.findByRole("button", { name: "apple" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("搜索生词"), "不存在");
    expect(screen.queryByRole("button", { name: "apple" })).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("搜索生词"));
    await user.click(await screen.findByRole("button", { name: "apple" }));
    expect(onOpenWord).toHaveBeenCalledWith("apple");

    await user.selectOptions(screen.getByLabelText("apple 的学习状态"), "mastered");
    await waitFor(() => expect(screen.getByLabelText("apple 的学习状态")).toHaveValue("mastered"));

    await user.click(screen.getByRole("button", { name: "删除 apple" }));
    await user.click(screen.getByRole("button", { name: "确认删除 apple" }));
    expect(await screen.findByText("还没有保存的单词。")).toBeInTheDocument();
  });
});
