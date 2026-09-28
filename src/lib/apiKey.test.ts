import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, getApiKey, hasApiKey, setApiKey } from "./apiKey";

describe("apiKey", () => {
  beforeEach(() => {
    clearApiKey();
    localStorage.clear();
  });

  it("keeps the key in memory and removes it when cleared", () => {
    expect(hasApiKey()).toBe(false);
    setApiKey("  sk-test  ");
    expect(getApiKey()).toBe("sk-test");
    expect(hasApiKey()).toBe(true);
    clearApiKey();
    expect(getApiKey()).toBe("");
    expect(hasApiKey()).toBe(false);
  });

  it("does not write the key to localStorage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setApiKey("sk-secret");
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    setItem.mockRestore();
  });
});
