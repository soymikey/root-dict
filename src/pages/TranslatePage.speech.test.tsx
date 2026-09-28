import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RecognitionController, RecognitionHandlers } from "../lib/speech";
import { TranslatePage } from "./TranslatePage";

function installFake() {
  let handlers: RecognitionHandlers | null = null;
  const stop = vi.fn();
  const controller: RecognitionController = {
    start(next) {
      handlers = next;
      return { stop };
    },
  };
  return {
    controller,
    stop,
    get handlers() {
      if (!handlers) {
        throw new Error("识别尚未开始");
      }
      return handlers;
    },
  };
}

describe("speech input", () => {
  it("writes the transcript into the field and waits for the user to translate", async () => {
    const user = userEvent.setup();
    const fake = installFake();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TranslatePage
        onOpenSettings={() => undefined}
        onOpenWord={() => undefined}
        createRecognition={() => fake.controller}
      />,
    );

    await user.click(screen.getByRole("button", { name: "English" }));
    await user.click(screen.getByRole("button", { name: "语音输入" }));
    expect(fake.handlers.lang).toBe("en-US");
    expect(screen.getByRole("status")).toHaveTextContent("正在聆听");

    act(() => {
      fake.handlers.onResult("hello there", true);
    });
    expect(screen.getByLabelText("翻译内容")).toHaveValue("hello there");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "停止语音输入" }));
    expect(fake.stop).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("explains unsupported browsers and denied permission without blocking typing", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <TranslatePage onOpenSettings={() => undefined} onOpenWord={() => undefined} createRecognition={() => null} />,
    );
    await user.click(screen.getByRole("button", { name: "语音输入" }));
    expect(screen.getByRole("alert")).toHaveTextContent("当前浏览器不支持语音识别");
    await user.type(screen.getByLabelText("翻译内容"), "键盘");
    expect(screen.getByLabelText("翻译内容")).toHaveValue("键盘");
    unmount();

    const fake = installFake();
    render(
      <TranslatePage
        onOpenSettings={() => undefined}
        onOpenWord={() => undefined}
        createRecognition={() => fake.controller}
      />,
    );
    await user.click(screen.getByRole("button", { name: "语音输入" }));
    act(() => {
      fake.handlers.onError("not-allowed");
    });
    expect(screen.getByRole("alert")).toHaveTextContent("麦克风权限被拒绝");
    expect(screen.getByLabelText("翻译内容")).toBeEnabled();
  });
});
