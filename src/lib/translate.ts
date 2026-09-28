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

export type GlossResult = {
  kind: "gloss";
  word: string;
  pos: string;
  gloss: string;
  ipa: string;
};

export type TranslationResult = SentenceResult | CandidatesResult | GlossResult;

const SYSTEM = "你是中英理解式词典的翻译模块。只输出符合 schema 的 JSON。释义使用简体中文。";

const sentenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    translation: { type: "string" },
  },
  required: ["translation"],
};

const glossSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pos: { type: "string" },
    gloss: { type: "string" },
    ipa: { type: "string" },
  },
  required: ["pos", "gloss", "ipa"],
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
    const parsed = await requestStructured({
      apiKey,
      schemaName: "word_gloss",
      schema: glossSchema,
      system: SYSTEM,
      user: `给出英文单词“${classified.text}”的美式音标、词性和核心简体中文释义。`,
      parse: (value) => {
        if (!isRecord(value)) {
          throw new Error("invalid");
        }
        return {
          pos: requiredText(value.pos),
          gloss: requiredText(value.gloss),
          ipa: requiredText(value.ipa),
        };
      },
    });
    return { kind: "gloss", word: classified.text, ...parsed };
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
