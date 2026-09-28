export const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODEL = "gpt-4.1-mini";

export class OpenAIError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "OpenAIError";
    this.status = status;
  }
}

type StructuredRequest<T> = {
  apiKey: string;
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  parse: (value: unknown) => T;
};

export async function requestStructured<T>({
  apiKey,
  schemaName,
  schema,
  system,
  user,
  parse,
}: StructuredRequest<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
      }),
    });
  } catch {
    throw new OpenAIError("网络不可用，无法生成新内容");
  }

  if (response.status === 401) {
    throw new OpenAIError("API 密钥无效", 401);
  }
  if (response.status === 429) {
    throw new OpenAIError("请求过于频繁，请稍后再试", 429);
  }
  if (!response.ok) {
    throw new OpenAIError("翻译失败，请重试", response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OpenAIError("结果格式无法识别，请重试");
  }

  const content = readContent(payload);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new OpenAIError("结果格式无法识别，请重试");
  }

  try {
    return parse(parsed);
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError("结果格式无法识别，请重试");
  }
}

function readContent(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    throw new OpenAIError("结果格式无法识别，请重试");
  }
  const choices = "choices" in payload ? payload.choices : undefined;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new OpenAIError("结果格式无法识别，请重试");
  }
  const message = choices[0]?.message;
  const content = message && typeof message === "object" ? message.content : undefined;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new OpenAIError("结果格式无法识别，请重试");
  }
  return content;
}
