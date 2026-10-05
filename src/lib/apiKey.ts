const STORAGE_KEY = "dict.openai-key";

export function setApiKey(value: string) {
  const trimmed = value.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function hasApiKey() {
  return getApiKey().length > 0;
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}
