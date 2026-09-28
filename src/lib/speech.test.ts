import { describe, expect, it } from "vitest";
import { speechErrorMessage } from "./speech";

describe("speechErrorMessage", () => {
  it("keeps keyboard input available when recognition is unsupported or denied", () => {
    expect(speechErrorMessage("not-supported")).toMatch(/不支持语音识别/);
    expect(speechErrorMessage("not-allowed")).toMatch(/权限被拒绝/);
    expect(speechErrorMessage("network")).toMatch(/键盘输入/);
  });
});
