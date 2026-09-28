import { useEffect, useState } from "react";
import { BackIcon, SpeakerIcon } from "../components/icons";
import { getApiKey, hasApiKey } from "../lib/apiKey";
import { OpenAIError } from "../lib/openai";
import type { Speaker } from "../lib/pronounce";
import { generateStory, type StoryPart, type WordStory } from "../lib/story";
import { usePronunciation } from "../lib/usePronunciation";

type StoryPageProps = {
  word: string;
  onBack: () => void;
  speaker?: Speaker;
};

export function StoryPage({ word, onBack, speaker }: StoryPageProps) {
  const [story, setStory] = useState<WordStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const { speaking, voiceError, speakText } = usePronunciation(speaker);
  const title = story?.word ?? word;

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
      <header className="page-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="返回">
          <BackIcon />
        </button>
        <h1>
          <button
            type="button"
            className={speaking === title ? "word-hit is-speaking" : "word-hit"}
            aria-pressed={speaking === title}
            onClick={() => speakText(title)}
          >
            {title}
          </button>
        </h1>
        <button type="button" className="icon-button" aria-label={`朗读 ${title}`} onClick={() => speakText(title)}>
          <SpeakerIcon />
        </button>
      </header>
      {loading ? <p className="status-line">正在整理单词故事</p> : null}
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
      {story ? <StoryBody story={story} speaking={speaking} onSpeak={speakText} /> : null}
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

function StoryBody({
  story,
  speaking,
  onSpeak,
}: {
  story: WordStory;
  speaking: string | null;
  onSpeak: (text: string) => void;
}) {
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
            <p>
              <button
                type="button"
                className={speaking === example.en ? "word-button is-speaking" : "word-button"}
                aria-pressed={speaking === example.en}
                onClick={() => onSpeak(example.en)}
              >
                {example.en}
              </button>
            </p>
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
