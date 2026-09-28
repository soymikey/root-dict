import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, setApiKey } from "../lib/apiKey";
import { TranslatePage } from "./TranslatePage";

describe("offline translation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearApiKey();
  });

  it("shows an offline state and does not request a new translation", async () => {
    const user = userEvent.setup();
    setApiKey("sk-test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<TranslatePage onOpenSettings={() => undefined} onOpenWord={() => undefined} online={false} />);

    expect(screen.getByRole("status")).toHaveTextContent("当前离线");
    await user.type(screen.getByLabelText("翻译内容"), "Hello, world");
    expect(screen.getByRole("button", { name: "翻译" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
