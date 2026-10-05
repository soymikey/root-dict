import { OpenAIError, requestStructured } from "./openai";

export type StoryPart = {
  text: string;
  meaning: string;
};

export type WordStory = {
  word: string;
  gloss: string;
  ipa: string;
  pos: string;
  forms: { label: string; value: string }[];
  morphology: {
    prefix: StoryPart;
    root: StoryPart;
    suffix: StoryPart;
  };
  etymology: {
    confidence: "confirmed" | "uncertain";
    origin: string;
    evolution: string;
  };
  family: { word: string; gloss: string }[];
  synonyms: { word: string; distinction: string }[];
  examples: { en: string; zh: string }[];
  mnemonic: string;
};

const partSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
    meaning: { type: "string" },
  },
  required: ["text", "meaning"],
};

const storySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    gloss: { type: "string" },
    ipa: { type: "string" },
    pos: { type: "string" },
    forms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
      },
    },
    prefix: partSchema,
    root: partSchema,
    suffix: partSchema,
    etymologyConfidence: { type: "string", enum: ["confirmed", "uncertain"] },
    etymologyOrigin: { type: "string" },
    etymologyEvolution: { type: "string" },
    family: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          gloss: { type: "string" },
        },
        required: ["word", "gloss"],
      },
    },
    synonyms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          word: { type: "string" },
          distinction: { type: "string" },
        },
        required: ["word", "distinction"],
      },
    },
    examples: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          en: { type: "string" },
          zh: { type: "string" },
        },
        required: ["en", "zh"],
      },
    },
    mnemonic: { type: "string" },
  },
  required: [
    "gloss",
    "ipa",
    "pos",
    "forms",
    "prefix",
    "root",
    "suffix",
    "etymologyConfidence",
    "etymologyOrigin",
    "etymologyEvolution",
    "family",
    "synonyms",
    "examples",
    "mnemonic",
  ],
};

const SYSTEM = [
  "你是词根词典。只输出符合 schema 的 JSON。",
  "词源必须区分已证实和不确定。无法确认时 etymologyConfidence 必须是 uncertain，并在 etymologyOrigin 里说明不确定什么。",
  "禁止编造年代、文献、人物或虚假词源。",
  "mnemonic 只是帮助记忆的联想，不能写成历史事实，也不能复述词源。",
  "音标使用美式 IPA。释义和例句译文使用简体中文。",
  "没有前缀或后缀时，text 和 meaning 都用空字符串。",
].join("");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown, allowEmpty = false) {
  if (typeof value !== "string") {
    throw new Error("invalid");
  }
  const trimmed = value.trim();
  if (!allowEmpty && trimmed.length === 0) {
    throw new Error("invalid");
  }
  return trimmed;
}

function part(value: unknown, allowEmpty: boolean): StoryPart {
  if (!isRecord(value)) {
    throw new Error("invalid");
  }
  return { text: text(value.text, allowEmpty), meaning: text(value.meaning, allowEmpty) };
}

function entries<T>(value: unknown, map: (item: Record<string, unknown>) => T) {
  if (!Array.isArray(value)) {
    throw new Error("invalid");
  }
  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error("invalid");
    }
    return map(item);
  });
}

export function parseStory(value: unknown, word: string): WordStory {
  if (!isRecord(value)) {
    throw new Error("invalid");
  }
  const confidence = value.etymologyConfidence;
  if (confidence !== "confirmed" && confidence !== "uncertain") {
    throw new Error("invalid");
  }
  const examples = entries(value.examples, (item) => ({ en: text(item.en), zh: text(item.zh) }));
  if (examples.length === 0) {
    throw new Error("invalid");
  }
  return {
    word: word.trim(),
    gloss: text(value.gloss),
    ipa: text(value.ipa),
    pos: text(value.pos),
    forms: entries(value.forms, (item) => ({ label: text(item.label), value: text(item.value) })),
    morphology: {
      prefix: part(value.prefix, true),
      root: part(value.root, false),
      suffix: part(value.suffix, true),
    },
    etymology: {
      confidence,
      origin: text(value.etymologyOrigin),
      evolution: text(value.etymologyEvolution),
    },
    family: entries(value.family, (item) => ({ word: text(item.word), gloss: text(item.gloss) })),
    synonyms: entries(value.synonyms, (item) => ({
      word: text(item.word),
      distinction: text(item.distinction),
    })),
    examples,
    mnemonic: text(value.mnemonic),
  };
}

export async function generateStory(apiKey: string, word: string) {
  const clean = word.trim();
  if (!clean) {
    throw new OpenAIError("请输入英文单词");
  }
  return requestStructured({
    apiKey,
    schemaName: "word_story",
    schema: storySchema,
    system: SYSTEM,
    user: `为英文单词“${clean}”生成单词故事卡。`,
    parse: (value) => parseStory(value, clean),
  });
}
