const STORAGE_KEY = "dict.openai-key";

export const API_KEY_CHANGED_EVENT = "dict:api-key-changed";

export type ApiKeySaveResult = { ok: true } | { ok: false; reason: "empty" | "storage-blocked" | "verify-failed" };

function notifyApiKeyChanged() {
  window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
}

export function setApiKey(value: string): ApiKeySaveResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
    if (localStorage.getItem(STORAGE_KEY) !== trimmed) {
      return { ok: false, reason: "verify-failed" };
    }
    notifyApiKeyChanged();
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage-blocked" };
  }
}

export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function hasApiKey() {
  return getApiKey().length > 0;
}

export function clearApiKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyApiKeyChanged();
  } catch {
    // Ignore blocked storage; UI will resync on next read.
  }
}

export function apiKeySaveErrorMessage(reason: Exclude<ApiKeySaveResult, { ok: true }>["reason"]) {
  switch (reason) {
    case "empty":
      return "请输入 API 密钥。";
    case "storage-blocked":
      return "无法写入本机存储。请检查浏览器是否禁用了网站数据，或退出无痕模式后重试。";
    case "verify-failed":
      return "密钥保存失败，请重试。";
  }
}
