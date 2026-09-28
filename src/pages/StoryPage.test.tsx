import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, setApiKey } from "../lib/apiKey";
import type { Speaker } from "../lib/pronounce";
import { StoryPage } from "./StoryPage";

const story = {
  gloss: "苹果",
  ipa: "/ˈæp.əl/",
  pos: "n.",
  forms: [{ label: "复数", value: "apples" }],
  prefix: { text: "", meaning: "" },
  root: { text: "apple", meaning: "苹果" },
  suffix: { text: "", meaning: "" },
  etymologyConfidence: "uncertain",
  etymologyOrigin: "拉丁语路径不确定。",
  etymologyEvolution: "后来主要指这种水果。",
  family: [{ word: "pineapple", gloss: "菠萝" }],
  synonyms: [{ word: "pome", distinction: "植物学用语。" }],
  examples: [{ en: "She ate an apple.", zh: "她吃了一个苹果。" }],
  mnemonic: "想象苹果滚进抽屉。",
};

function mockStory(content: unknown = story) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  });
}

describe("StoryPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearApiKey();
  });

  it("shows etymology and the mnemonic in separate sections", async () => {
    setApiKey("sk-test");
    const fetchMock = mockStory();
    vi.stubGlobal("fetch", fetchMock);
    const onBack = vi.fn();
    render(<StoryPage word="apple" onBack={onBack} />);

    expect(await screen.findByRole("region", { name: "词源" })).toHaveTextContent("不确定");
    expect(screen.getByRole("region", { name: "词源" })).toHaveTextContent("拉丁语路径不确定");
    const mnemonic = screen.getByRole("region", { name: "记忆联想" });
    expect(mnemonic).toHaveTextContent("想象苹果滚进抽屉");
    expect(mnemonic).toHaveTextContent("不是词源事实");
    expect(mnemonic).not.toHaveTextContent("拉丁语");
    expect(screen.getByText("She ate an apple.")).toBeInTheDocument();
    expect(screen.getByText("菠萝")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "重新生成" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole("button", { name: "返回" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("does not call the API without a key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<StoryPage word="apple" onBack={() => undefined} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("请先在设置中填写 API 密钥");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("marks the word while it is speaking", async () => {
    const user = userEvent.setup();
    setApiKey("sk-test");
    vi.stubGlobal("fetch", mockStory());
    const speak = vi.fn((_request, events: { onStart: () => void }) => {
      events.onStart();
    });
    const speaker: Speaker = { speak, cancel: vi.fn() };
    render(<StoryPage word="apple" onBack={() => undefined} speaker={speaker} />);
    await screen.findByRole("region", { name: "词源" });
    await user.click(screen.getByRole("button", { name: "朗读 apple" }));
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "apple", lang: "en" }), expect.any(Object));
    expect(screen.getByRole("button", { name: "apple" })).toHaveAttribute("aria-pressed", "true");
  });
});
