let apiKey = "";

export function setApiKey(value: string) {
  apiKey = value.trim();
}

export function getApiKey() {
  return apiKey;
}

export function hasApiKey() {
  return apiKey.length > 0;
}

export function clearApiKey() {
  apiKey = "";
}
