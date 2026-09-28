import { useState } from "react";
import { browserSpeaker, preferAmericanVoice, type Speaker } from "./pronounce";

export function usePronunciation(speaker: Speaker = browserSpeaker()) {
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState("");

  function speakText(text: string, lang: "en" | "zh" = "en") {
    setVoiceError("");
    speaker.speak(
      { text, lang, preferAmerican: preferAmericanVoice() },
      {
        onStart: () => setSpeaking(text),
        onEnd: () => setSpeaking((current) => (current === text ? null : current)),
        onError: () => {
          setSpeaking(null);
          setVoiceError("当前设备没有可用的英文声音");
        },
      },
    );
  }

  return { speaking, voiceError, speakText };
}
