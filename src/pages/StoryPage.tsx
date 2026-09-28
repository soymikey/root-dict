import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { getApiKey, hasApiKey } from "../lib/apiKey";
import { OpenAIError } from "../lib/openai";
import { generateStory, type StoryPart, type WordStory } from "../lib/story";

type StoryPageProps = {
  word: string;
  onBack: () => void;
};

export function StoryPage({ word, onBack }: StoryPageProps) {
  const [story, setStory] = useState<WordStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasApiKey()) {
        setStory(null);
        setError("请先在设置中填写 API 密钥");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const next = await generateStory(getApiKey(), word);
        if (!cancelled) {
          setStory(next);
        }
      } catch (caught) {
        if (!cancelled) {
          setStory(null);
          setError(caught instanceof OpenAIError ? caught.message : "单词故事生成失败，请重试");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [word, generation]);

  return (
    <section className="page story-page">
      <PageHeader title={story?.word ?? word} onBack={onBack} />
      {loading ? <p className="status-line">正在整理单词故事</p> : null}
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
      {story ? <StoryBody story={story} /> : null}
      <div className="button-row">
        <button
          type="button"
          className="button primary"
          onClick={() => setGeneration((value) => value + 1)}
          disabled={loading || !hasApiKey()}
        >
          重新生成
        </button>
      </div>
    </section>
  );
}

function StoryBody({ story }: { story: WordStory }) {
  const parts = [story.morphology.prefix, story.morphology.root, story.morphology.suffix].filter(
    (part) => part.text.length > 0,
  );

  return (
    <div className="story-body">
      <p className="ipa">{story.ipa}</p>
      <p className="translation">
        {story.pos} · {story.gloss}
      </p>
      {story.forms.length > 0 ? (
        <p className="forms">
          {story.forms.map((form) => `${form.label} ${form.value}`).join("  ·  ")}
        </p>
      ) : null}
      <section className="story-section" aria-label="构词">
        <h2>构词</h2>
        <div className="morph">
          {parts.map((part) => (
            <Part key={`${part.text}-${part.meaning}`} part={part} />
          ))}
        </div>
      </section>
      <section className="story-section" aria-label="词源">
        <h2>
          词源
          {story.etymology.confidence === "uncertain" ? <span className="badge">不确定</span> : null}
        </h2>
        <p>{story.etymology.origin}</p>
        <p>{story.etymology.evolution}</p>
      </section>
      <section className="story-section" aria-label="词族">
        <h2>词族</h2>
        {story.family.length === 0 ? <p>暂无确认的同词根词。</p> : null}
        <ul className="plain-list">
          {story.family.map((item) => (
            <li key={item.word}>
              <strong>{item.word}</strong>
              <span>{item.gloss}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="story-section" aria-label="近义词">
        <h2>近义词</h2>
        <ul className="plain-list">
          {story.synonyms.map((item) => (
            <li key={item.word}>
              <strong>{item.word}</strong>
              <span>{item.distinction}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="story-section" aria-label="例句">
        <h2>例句</h2>
        {story.examples.map((example) => (
          <div className="example" key={example.en}>
            <p>{example.en}</p>
            <p className="source">{example.zh}</p>
          </div>
        ))}
      </section>
      <section className="story-section" aria-label="记忆联想">
        <h2>记忆联想</h2>
        <p className="mnemonic-note">这是助记联想，不是词源事实。</p>
        <p>{story.mnemonic}</p>
      </section>
    </div>
  );
}

function Part({ part }: { part: StoryPart }) {
  return (
    <div>
      <strong>{part.text}</strong>
      <span>{part.meaning}</span>
    </div>
  );
}
