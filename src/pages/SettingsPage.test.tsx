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

  it("stores a key in localStorage and explains the privacy risk", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByRole("status")).toHaveTextContent("尚未填写");
    expect(screen.getByText(/浏览器直接/)).toBeInTheDocument();
    expect(screen.getByText(/localStorage/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("API 密钥"), "sk-live");
    await user.click(screen.getByRole("button", { name: "保存密钥" }));

    expect(getApiKey()).toBe("sk-live");
    expect(localStorage.getItem("dict.openai-key")).toBe("sk-live");
    expect(screen.getByRole("status")).toHaveTextContent("已保存到本机");

    await user.click(screen.getByRole("button", { name: "清除密钥" }));
    expect(getApiKey()).toBe("");
    expect(screen.getByRole("status")).toHaveTextContent("尚未填写");
  });

  it("toggles the default American pronunciation", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    render(<SettingsPage />);
    const toggle = screen.getByRole("switch", { name: "默认美式发音" });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(localStorage.getItem("dict.prefer-american")).toBe("0");
    expect(screen.getByText(/系统声音/)).toBeInTheDocument();
  });

  it("offers installation and explains the home-screen fallback", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    expect(screen.getByText(/添加到主屏幕/)).toBeInTheDocument();

    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, { prompt });
    window.dispatchEvent(event);

    await user.click(await screen.findByRole("button", { name: "安装到主屏幕" }));
    expect(prompt).toHaveBeenCalledOnce();
  });
});
