import { beforeEach, describe, expect, it } from "vitest";
import { clearApiKey, getApiKey, hasApiKey, setApiKey } from "./apiKey";

describe("apiKey", () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiKey();
  });

  it("persists the key in localStorage and removes it when cleared", () => {
    expect(hasApiKey()).toBe(false);
    setApiKey("  sk-test  ");
    expect(getApiKey()).toBe("sk-test");
    expect(localStorage.getItem("dict.openai-key")).toBe("sk-test");
    expect(hasApiKey()).toBe(true);
    clearApiKey();
    expect(getApiKey()).toBe("");
    expect(localStorage.getItem("dict.openai-key")).toBeNull();
    expect(hasApiKey()).toBe(false);
  });

  it("reads a saved key after reload", () => {
    localStorage.setItem("dict.openai-key", "sk-reload");
    expect(getApiKey()).toBe("sk-reload");
    expect(hasApiKey()).toBe(true);
  });
});
