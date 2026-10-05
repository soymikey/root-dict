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

  it("opens settings when the key is missing", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    render(<TranslatePage onOpenSettings={onOpenSettings} onOpenWord={() => undefined} />);

    await user.click(screen.getByRole("button", { name: "需要 API 密钥" }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(screen.queryByText("请输入中文或英文")).not.toBeInTheDocument();
    expect(screen.queryByText("英文 → 中文")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("翻译内容"), "Hello, world");
    await user.click(screen.getByRole("button", { name: "翻译" }));
    expect(screen.getByRole("alert")).toHaveTextContent("请先在设置中填写 API 密钥");
  });

  it("shows a sentence translation and a selectable Chinese-word candidate", async () => {
    const user = userEvent.setup();
    setApiKey("sk-test");
    const onOpenWord = vi.fn();
    const fetchMock = mockChat({ translation: "你好，世界" });
    vi.stubGlobal("fetch", fetchMock);
    render(<TranslatePage onOpenSettings={() => undefined} onOpenWord={onOpenWord} />);

    expect(screen.getByRole("group", { name: "语音语言" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "需要 API 密钥" })).not.toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "翻译" }));
    await user.click(await screen.findByRole("button", { name: /苹果公司/ }));
    expect(onOpenWord).toHaveBeenCalledWith("Apple");

    await user.click(screen.getByRole("button", { name: "清空" }));
    expect(screen.getByLabelText("翻译内容")).toHaveValue("");
  });

  it("opens the story card for an English word", async () => {
    const user = userEvent.setup();
    setApiKey("sk-test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onOpenWord = vi.fn();
    render(<TranslatePage onOpenSettings={() => undefined} onOpenWord={onOpenWord} />);

    await user.type(screen.getByLabelText("翻译内容"), "hello");
    await user.click(screen.getByRole("button", { name: "翻译" }));
    expect(onOpenWord).toHaveBeenCalledWith("hello");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
