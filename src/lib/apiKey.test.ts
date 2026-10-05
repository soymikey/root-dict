import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_KEY_CHANGED_EVENT, clearApiKey, getApiKey, hasApiKey, setApiKey } from "./apiKey";

describe("apiKey", () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiKey();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists the key in localStorage and removes it when cleared", () => {
    expect(hasApiKey()).toBe(false);
    expect(setApiKey("  sk-test  ")).toEqual({ ok: true });
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

  it("rejects empty keys", () => {
    expect(setApiKey("   ")).toEqual({ ok: false, reason: "empty" });
    expect(hasApiKey()).toBe(false);
  });

  it("reports blocked storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    expect(setApiKey("sk-test")).toEqual({ ok: false, reason: "storage-blocked" });
    expect(hasApiKey()).toBe(false);
  });

  it("notifies listeners when the key changes", () => {
    const listener = vi.fn();
    window.addEventListener(API_KEY_CHANGED_EVENT, listener);
    setApiKey("sk-test");
    clearApiKey();
    window.removeEventListener(API_KEY_CHANGED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
