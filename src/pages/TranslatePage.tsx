import { useRef, useState } from "react";
import { MicIcon, SpeakerIcon, StopIcon } from "../components/icons";
import { PageHeader } from "../components/PageHeader";
import { hasApiKey, getApiKey } from "../lib/apiKey";
import { classifyInput } from "../lib/classify";
import { OfflineNotice, useOnlineStatus } from "../lib/online";
import { tokenizeEnglish, type Speaker } from "../lib/pronounce";
import { usePronunciation } from "../lib/usePronunciation";
import {
  browserRecognition,
  speechErrorMessage,
  type RecognitionController,
  type RecognitionSession,
} from "../lib/speech";
import { OpenAIError, translateInput, type TranslationResult } from "../lib/translate";

type SpeechLang = "zh-CN" | "en-US";

type TranslatePageProps = {
  onOpenSettings: () => void;
  onOpenWord: (word: string) => void;
  createRecognition?: () => RecognitionController | null;
  speaker?: Speaker;
  online?: boolean;
};

export function TranslatePage({
  onOpenSettings,
  onOpenWord,
  createRecognition,
  speaker,
  online,
}: TranslatePageProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<SpeechLang>("zh-CN");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const sessionRef = useRef<RecognitionSession | null>(null);
  const { speaking, voiceError, speakText } = usePronunciation(speaker);
  const liveOnline = useOnlineStatus();
  const isOnline = online ?? liveOnline;
  const classified = classifyInput(text);
  const keyReady = hasApiKey();
  const needsNetwork = classified.kind === "zh-word" || classified.kind === "zh-sentence" || classified.kind === "en-sentence";

  function toggleListening() {
    if (listening) {
      sessionRef.current?.stop();
      setListening(false);
      return;
    }
    const controller = (createRecognition ?? browserRecognition)();
    if (!controller) {
      setError(speechErrorMessage("not-supported"));
      return;
    }
    setError("");
    setListening(true);
    sessionRef.current = controller.start({
      lang: speechLang,
      onResult: (transcript) => {
        setText(transcript);
      },
      onError: (code) => {
        if (code === "aborted") {
          return;
        }
        setListening(false);
        setError(speechErrorMessage(code));
      },
      onEnd: () => {
        setListening(false);
      },
    });
  }

  async function translate() {
    if (!hasApiKey()) {
      setError("请先在设置中填写 API 密钥");
      return;
    }
    if (classified.kind === "empty") {
      setError("请输入要翻译的内容");
      return;
    }
    if (!isOnline && classified.kind !== "en-word") {
      setError("离线时不能生成新翻译");
      return;
    }
    if (classified.kind === "en-word") {
      onOpenWord(classified.text);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await translateInput(getApiKey(), text));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof OpenAIError ? caught.message : "翻译失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setText("");
    setResult(null);
    setError("");
  }

  return (
    <section className="page" id="panel-translate" role="tabpanel" aria-labelledby="tab-translate">
      <PageHeader
        title="翻译"
        trailing={
          <button type="button" className="text-button" onClick={onOpenSettings}>
            {keyReady ? "密钥已填写" : "需要 API 密钥"}
          </button>
        }
      />
      <OfflineNotice online={isOnline} />
      <div className="composer">
        <label>
          <span className="visually-hidden">翻译内容</span>
          <textarea
            value={text}
            placeholder="输入单词、短语或句子"
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={listening ? "mic-button is-listening" : "mic-button"}
          aria-pressed={listening}
          aria-label={listening ? "停止语音输入" : "语音输入"}
          onClick={toggleListening}
        >
          {listening ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
      <div className="segmented" role="group" aria-label="语音语言">
        <button type="button" aria-pressed={speechLang === "zh-CN"} onClick={() => setSpeechLang("zh-CN")}>
          中文
        </button>
        <button type="button" aria-pressed={speechLang === "en-US"} onClick={() => setSpeechLang("en-US")}>
          English
        </button>
      </div>
      <p className="direction">{classified.direction}</p>
      {listening ? (
        <p className="status-line" role="status">
          正在聆听
        </p>
      ) : null}
      <div className="button-row">
        <button type="button" className="button secondary" onClick={clear}>
          清空
        </button>
        <button
          type="button"
          className="button primary"
          onClick={translate}
          disabled={loading || (!isOnline && needsNetwork)}
        >
          {loading ? "翻译中" : "翻译"}
        </button>
      </div>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {voiceError ? (
        <p className="alert" role="alert">
          {voiceError}
        </p>
      ) : null}
      {result ? (
        <ResultView result={result} speaking={speaking} onOpenWord={onOpenWord} onSpeak={speakText} />
      ) : null}
    </section>
  );
}

function ResultView({
  result,
  speaking,
  onOpenWord,
  onSpeak,
}: {
  result: TranslationResult;
  speaking: string | null;
  onOpenWord: (word: string) => void;
  onSpeak: (text: string) => void;
}) {
  if (result.kind === "sentence") {
    const englishText = result.sourceLang === "en" ? result.source : result.translation;
    const tokens = tokenizeEnglish(englishText);
    return (
      <article className="result">
        <div className="sentence-toolbar">
          <p className="result-kicker">句子</p>
          <button
            type="button"
            className="icon-button"
            aria-label="朗读句子"
            aria-pressed={speaking === englishText}
            onClick={() => onSpeak(englishText)}
          >
            <SpeakerIcon />
          </button>
        </div>
        {result.sourceLang === "zh" ? <p className="source">{result.source}</p> : null}
        <p className="sentence-line">
          {tokens.map((token, index) =>
            token.speakable ? (
              <button
                key={`${token.text}-${index}`}
                type="button"
                className={speaking === token.text ? "word-button is-speaking" : "word-button"}
                aria-pressed={speaking === token.text}
                onClick={() => {
                  onSpeak(token.text);
                  onOpenWord(token.text);
                }}
              >
                {token.text}
              </button>
            ) : (
              <span key={`${token.text}-${index}`}>{token.text}</span>
            ),
          )}
        </p>
        {result.sourceLang === "en" ? <p className="translation">{result.translation}</p> : null}
      </article>
    );
  }

  return (
    <div className="result">
      <p className="result-kicker">英文候选</p>
      <ul className="candidate-list">
        {result.candidates.map((candidate) => (
          <li key={`${candidate.word}-${candidate.gloss}`}>
            <button type="button" onClick={() => onOpenWord(candidate.word)}>
              <strong>{candidate.word}</strong>
              <span>
                {candidate.pos} · {candidate.gloss}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
