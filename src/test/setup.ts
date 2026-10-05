import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

afterEach(async () => {
  cleanup();
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase("root-dict");
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => resolve(undefined);
    request.onblocked = () => resolve(undefined);
  });
});
