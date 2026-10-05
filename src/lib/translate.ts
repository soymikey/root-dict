import { classifyInput } from "./classify";
import { OpenAIError, requestStructured } from "./openai";

export { OpenAIError };

export type Candidate = {
  word: string;
  pos: string;
  gloss: string;
};

export type SentenceResult = {
  kind: "sentence";
  sourceLang: "zh" | "en";
  source: string;
  translation: string;
};

export type CandidatesResult = {
  kind: "candidates";
  query: string;
  candidates: Candidate[];
};

export type TranslationResult = SentenceResult | CandidatesResult;

const SYSTEM = "你是词根词典的翻译模块。只输出符合 schema 的 JSON。释义使用简体中文。";

const sentenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    translation: { type: "string" },
  },
  required: ["translation"],
};

const candidatesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          pos: { type: "string" },
          gloss: { type: "string" },
        },
        required: ["word", "pos", "gloss"],
      },
    },
  },
  required: ["candidates"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredText(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("invalid");
  }
  return value.trim();
}

export async function translateInput(apiKey: string, raw: string): Promise<TranslationResult> {
  const classified = classifyInput(raw);
  if (classified.kind === "empty") {
    throw new OpenAIError("请输入要翻译的内容");
  }

  if (classified.kind === "zh-word") {
    const parsed = await requestStructured({
      apiKey,
      schemaName: "english_candidates",
      schema: candidatesSchema,
      system: SYSTEM,
      user: `给出“${classified.text}”最常见的英文候选词，最多 5 个。每个候选包含单词、词性和简体中文释义。`,
      parse: (value) => {
        if (!isRecord(value) || !Array.isArray(value.candidates) || value.candidates.length === 0) {
          throw new Error("invalid");
        }
        return value.candidates.map((item) => {
          if (!isRecord(item)) {
            throw new Error("invalid");
          }
          return {
            word: requiredText(item.word),
            pos: requiredText(item.pos),
            gloss: requiredText(item.gloss),
          };
        });
      },
    });
    return { kind: "candidates", query: classified.text, candidates: parsed };
  }

  if (classified.kind === "en-word") {
    throw new OpenAIError("英文单词请打开故事卡");
  }

  const target = classified.kind === "zh-sentence" ? "自然英文" : "简体中文";
  const parsed = await requestStructured({
    apiKey,
    schemaName: "sentence_translation",
    schema: sentenceSchema,
    system: SYSTEM,
    user: `把下面文本翻译成${target}，只返回译文。\n${classified.text}`,
    parse: (value) => {
      if (!isRecord(value)) {
        throw new Error("invalid");
      }
      return { translation: requiredText(value.translation) };
    },
  });

  return {
    kind: "sentence",
    sourceLang: classified.kind === "zh-sentence" ? "zh" : "en",
    source: classified.text,
    translation: parsed.translation,
  };
}
