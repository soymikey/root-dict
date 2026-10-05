import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { API_KEY_CHANGED_EVENT, clearApiKey, setApiKey } from "./apiKey";
import { useApiKey } from "./useApiKey";

function Probe() {
  const keyReady = useApiKey();
  return <p>{keyReady ? "ready" : "missing"}</p>;
}

describe("useApiKey", () => {
  it("updates when the key is saved, cleared, or storage changes", async () => {
    clearApiKey();
    render(<Probe />);
    expect(screen.getByText("missing")).toBeInTheDocument();

    await act(async () => {
      setApiKey("sk-test");
    });
    expect(screen.getByText("ready")).toBeInTheDocument();

    await act(async () => {
      clearApiKey();
    });
    expect(screen.getByText("missing")).toBeInTheDocument();

    localStorage.setItem("dict.openai-key", "sk-sync");
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage"));
    });
    expect(screen.getByText("ready")).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
    });
    expect(screen.getByText("ready")).toBeInTheDocument();
  });
});
