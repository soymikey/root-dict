import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, getApiKey } from "../lib/apiKey";
import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    clearApiKey();
    localStorage.clear();
  });

  it("stores a key only in memory and explains the privacy risk", async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<SettingsPage />);

    expect(screen.getByRole("status")).toHaveTextContent("尚未填写");
    expect(screen.getByText(/浏览器直接/)).toBeInTheDocument();
    expect(screen.getByText(/不会写入/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("API 密钥"), "sk-live");
    await user.click(screen.getByRole("button", { name: "保存密钥" }));

    expect(getApiKey()).toBe("sk-live");
    expect(screen.getByRole("status")).toHaveTextContent("已填写");
    expect(setItem).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "清除密钥" }));
    expect(getApiKey()).toBe("");
    expect(screen.getByRole("status")).toHaveTextContent("尚未填写");
    setItem.mockRestore();
  });
});
