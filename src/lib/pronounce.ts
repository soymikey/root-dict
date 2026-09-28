export type VoiceChoice = {
  lang: string;
  name: string;
};

export type SentenceToken = {
  text: string;
  speakable: boolean;
};

export type SpeakRequest = {
  text: string;
  lang: "en" | "zh";
  preferAmerican: boolean;
};

export type SpeakEvents = {
  onStart: () => void;
  onEnd: () => void;
  onError: () => void;
};

export type Speaker = {
  speak: (request: SpeakRequest, events: SpeakEvents) => void;
  cancel: () => void;
};

const PREFER_AMERICAN_KEY = "dict.prefer-american";
const WORD = /[A-Za-z]+(?:[-'][A-Za-z]+)*|[^A-Za-z]+/g;

function normalizeLang(lang: string) {
  return lang.toLowerCase().replaceAll("_", "-");
}

export function pickEnglishVoice<T extends VoiceChoice>(voices: readonly T[], preferAmerican = true) {
  const english = voices.filter((voice) => normalizeLang(voice.lang).startsWith("en"));
  if (english.length === 0) {
    return null;
  }
  if (preferAmerican) {
    const american = english.find((voice) => normalizeLang(voice.lang).startsWith("en-us"));
    if (american) {
      return american;
    }
  }
  return english[0];
}

export function tokenizeEnglish(text: string): SentenceToken[] {
  return Array.from(text.matchAll(WORD), (match) => ({
    text: match[0],
    speakable: /^[A-Za-z]/.test(match[0]),
  }));
}

export function preferAmericanVoice() {
  try {
    return localStorage.getItem(PREFER_AMERICAN_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setPreferAmericanVoice(value: boolean) {
  localStorage.setItem(PREFER_AMERICAN_KEY, value ? "1" : "0");
}

export function browserSpeaker(): Speaker {
  return {
    cancel() {
      window.speechSynthesis?.cancel();
    },
    speak(request, events) {
      const synth = window.speechSynthesis;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
        events.onError();
        return;
      }
      const voices = synth.getVoices();
      const selected =
        request.lang === "zh"
          ? (voices.find((voice) => normalizeLang(voice.lang).startsWith("zh")) ?? null)
          : pickEnglishVoice(voices, request.preferAmerican);
      if (voices.length > 0 && !selected) {
        events.onError();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(request.text);
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang;
      } else {
        utterance.lang = request.lang === "zh" ? "zh-CN" : "en-US";
      }
      utterance.onstart = () => events.onStart();
      utterance.onend = () => events.onEnd();
      utterance.onerror = () => events.onError();
      synth.cancel();
      synth.speak(utterance);
    },
  };
}
