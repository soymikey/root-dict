export type InputKind = "empty" | "en-word" | "en-sentence" | "zh-word" | "zh-sentence";

export type ClassifiedInput = {
  kind: InputKind;
  text: string;
  direction: string;
};

const CJK = /[\u3400-\u9fff]/;
const SENTENCE_PUNCT = /[。！？!?；;，,、：:\n]/;
const ENGLISH_WORD = /^[A-Za-z]+(?:[-'][A-Za-z]+)*$/;

export function classifyInput(raw: string): ClassifiedInput {
  const text = raw.trim();
  if (!text) {
    return { kind: "empty", text: "", direction: "请输入中文或英文" };
  }

  if (CJK.test(text)) {
    const compact = text.replace(/\s+/g, "");
    const hasLatinWord = /[A-Za-z]{2,}/.test(text);
    const isWord = compact.length <= 8 && !SENTENCE_PUNCT.test(text) && !hasLatinWord;
    if (isWord) {
      return { kind: "zh-word", text, direction: "中文 → 英文候选" };
    }
    return { kind: "zh-sentence", text, direction: "中文 → 英文" };
  }

  if (ENGLISH_WORD.test(text)) {
    return { kind: "en-word", text, direction: "英文单词 → 中文" };
  }

  return { kind: "en-sentence", text, direction: "英文 → 中文" };
}
