import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, setApiKey } from "../lib/apiKey";
import type { Speaker } from "../lib/pronounce";
import { TranslatePage } from "./TranslatePage";

describe("sentence pronunciation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearApiKey();
  });

  it("reads the English sentence and opens a story when a word is tapped", async () => {
    const user = userEvent.setup();
    setApiKey("sk-test");
    const onOpenWord = vi.fn();
    const speak = vi.fn();
    const speaker: Speaker = { speak, cancel: vi.fn() };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ translation: "你好，世界" }) } }],
        }),
      }),
    );
    render(<TranslatePage onOpenSettings={() => undefined} onOpenWord={onOpenWord} speaker={speaker} />);

    await user.type(screen.getByLabelText("翻译内容"), "Hello, world");
    await user.click(screen.getByRole("button", { name: "翻译" }));
    expect(await screen.findByText("你好，世界")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "朗读句子" }));
    expect(speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Hello, world", lang: "en" }),
      expect.any(Object),
    );

    await user.click(screen.getByRole("button", { name: "Hello" }));
    expect(onOpenWord).toHaveBeenCalledWith("Hello");
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "Hello", lang: "en" }), expect.any(Object));
  });
});
