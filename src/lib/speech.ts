export type RecognitionHandlers = {
  lang: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (code: string) => void;
  onEnd: () => void;
};

export type RecognitionSession = {
  stop: () => void;
};

export type RecognitionController = {
  start: (handlers: RecognitionHandlers) => RecognitionSession;
};

type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {
    results: ArrayLike<{ isFinal: boolean; 0?: { transcript: string } }>;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionCtor = new () => BrowserRecognition;

export function speechErrorMessage(code: string) {
  switch (code) {
    case "not-supported":
      return "当前浏览器不支持语音识别，请使用键盘输入";
    case "not-allowed":
    case "service-not-allowed":
      return "麦克风权限被拒绝，仍可使用键盘输入";
    case "network":
      return "语音识别需要联网，仍可使用键盘输入";
    case "no-speech":
      return "没有听清，请再试一次";
    case "audio-capture":
      return "找不到麦克风，仍可使用键盘输入";
    default:
      return "语音识别失败，仍可使用键盘输入";
  }
}

export function browserRecognition(): RecognitionController | null {
  if (typeof window === "undefined") {
    return null;
  }
  const scoped = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  const Ctor = scoped.SpeechRecognition ?? scoped.webkitSpeechRecognition;
  if (!Ctor) {
    return null;
  }

  return {
    start(handlers) {
      const recognition = new Ctor();
      recognition.lang = handlers.lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = "";
        for (let index = 0; index < event.results.length; index += 1) {
          transcript += event.results[index]?.[0]?.transcript ?? "";
        }
        const last = event.results[event.results.length - 1];
        handlers.onResult(transcript.trim(), last?.isFinal ?? false);
      };
      recognition.onerror = (event) => {
        handlers.onError(event.error);
      };
      recognition.onend = () => {
        handlers.onEnd();
      };
      recognition.start();
      return {
        stop() {
          recognition.stop();
        },
      };
    },
  };
}
