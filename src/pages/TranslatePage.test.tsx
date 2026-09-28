import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, setApiKey } from "../lib/apiKey";
import { TranslatePage } from "./TranslatePage";

function mockChat(content: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  });
}

describe("TranslatePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearApiKey();
  });

  it("shows the detected direction and opens settings when the key is missing", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(<TranslatePage onOpenSettings={onOpenSettings} />);

    await user.click(screen.getByRole("button", { name: "需要 API 密钥" }));
    expect(onOpenSettings).toHaveBeenCalledOnce();

    await user.type(screen.getByLabelText("翻译内容"), "hello");
    expect(screen.getByText("英文单词 → 中文")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("翻译内容"));
    await user.type(screen.getByLabelText("翻译内容"), "Hello, world");
    expect(screen.getByText("英文 → 中文")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "翻译" }));
    expect(screen.getByRole("alert")).toHaveTextContent("请先在设置中填写 API 密钥");
  });

  it("shows a sentence translation and a selectable Chinese-word candidate", async () => {
    const user = userEvent.setup();
    setApiKey("sk-test");
    const fetchMock = mockChat({ translation: "你好，世界" });
    vi.stubGlobal("fetch", fetchMock);
    render(<TranslatePage onOpenSettings={() => undefined} />);

    expect(screen.getByRole("button", { name: "密钥已填写" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("翻译内容"), "Hello, world");
    await user.click(screen.getByRole("button", { name: "翻译" }));
    expect(await screen.findByText("你好，世界")).toBeInTheDocument();

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  { word: "apple", pos: "n.", gloss: "苹果" },
                  { word: "Apple", pos: "n.", gloss: "苹果公司" },
                ],
              }),
            },
          },
        ],
      }),
    });
    await user.clear(screen.getByLabelText("翻译内容"));
    await user.type(screen.getByLabelText("翻译内容"), "苹果");
    expect(screen.getByText("中文 → 英文候选")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "翻译" }));
    await user.click(await screen.findByRole("button", { name: /苹果公司/ }));
    expect(screen.getByRole("article", { name: "候选详情" })).toHaveTextContent("Apple");
    expect(screen.getByRole("article", { name: "候选详情" })).toHaveTextContent("苹果公司");

    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(screen.getByLabelText("翻译内容")).toHaveValue("");
    expect(screen.queryByRole("article", { name: "候选详情" })).not.toBeInTheDocument();
  });
});
