import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell", () => {
  it("shows the translate page and switches between the three tabs", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "翻译" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "翻译" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "生词库" }));
    expect(screen.getByRole("heading", { name: "生词库" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "生词库" })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("tab", { name: "设置" }));
    expect(screen.getByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toHaveAttribute("aria-selected", "true");
  });
});
