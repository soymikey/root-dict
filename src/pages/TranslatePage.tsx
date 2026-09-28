import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { hasApiKey, getApiKey } from "../lib/apiKey";
import { classifyInput } from "../lib/classify";
import { OpenAIError, translateInput, type CandidatesResult, type TranslationResult } from "../lib/translate";

type TranslatePageProps = {
  onOpenSettings: () => void;
};

export function TranslatePage({ onOpenSettings }: TranslatePageProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const classified = classifyInput(text);
  const keyReady = hasApiKey();

  async function translate() {
    if (!hasApiKey()) {
      setError("请先在设置中填写 API 密钥");
      return;
    }
    if (classified.kind === "empty") {
      setError("请输入要翻译的内容");
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
      <label className="composer">
        <span className="visually-hidden">翻译内容</span>
        <textarea
          value={text}
          placeholder="输入单词、短语或句子"
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <p className="direction">{classified.direction}</p>
      <div className="button-row">
        <button type="button" className="button secondary" onClick={clear}>
          清空
        </button>
        <button type="button" className="button primary" onClick={translate} disabled={loading}>
          {loading ? "翻译中" : "翻译"}
        </button>
      </div>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {result ? <ResultView result={result} /> : null}
    </section>
  );
}

function ResultView({ result }: { result: TranslationResult }) {
  if (result.kind === "sentence") {
    return (
      <article className="result">
        <p className="result-kicker">句子</p>
        <p className="source">{result.source}</p>
        <p className="translation">{result.translation}</p>
      </article>
    );
  }

  if (result.kind === "gloss") {
    return (
      <article className="result">
        <p className="result-kicker">单词</p>
        <h2>{result.word}</h2>
        <p className="ipa">{result.ipa}</p>
        <p>
          {result.pos} · {result.gloss}
        </p>
      </article>
    );
  }

  return <CandidatesView result={result} />;
}

function CandidatesView({ result }: { result: CandidatesResult }) {
  const [selected, setSelected] = useState(0);
  const current = result.candidates[selected] ?? result.candidates[0];

  return (
    <div className="result">
      <p className="result-kicker">英文候选</p>
      <ul className="candidate-list">
        {result.candidates.map((candidate, index) => (
          <li key={`${candidate.word}-${candidate.gloss}`}>
            <button
              type="button"
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              <strong>{candidate.word}</strong>
              <span>
                {candidate.pos} · {candidate.gloss}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {current ? (
        <article className="detail" aria-label="候选详情">
          <h2>{current.word}</h2>
          <p>
            {current.pos} · {current.gloss}
          </p>
        </article>
      ) : null}
    </div>
  );
}
