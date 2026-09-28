import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { deleteSavedWord, listSavedWords, setSavedMastery, type Mastery, type SavedWord } from "../lib/vocab";

const filters: { id: Mastery | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "new", label: "未学习" },
  { id: "learning", label: "学习中" },
  { id: "mastered", label: "已掌握" },
];

type VocabPageProps = {
  onOpenWord: (word: string) => void;
};

export function VocabPage({ onOpenWord }: VocabPageProps) {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Mastery | "all">("all");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listSavedWords().then((records) => {
      if (!cancelled) {
        setWords(records);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = words.filter((item) => {
    const matchesFilter = filter === "all" || item.mastery === filter;
    const haystack = `${item.word} ${item.story.gloss}`.toLowerCase();
    return matchesFilter && (needle.length === 0 || haystack.includes(needle));
  });

  async function changeMastery(item: SavedWord, mastery: Mastery) {
    await setSavedMastery(item.id, mastery);
    setWords((current) => current.map((word) => (word.id === item.id ? { ...word, mastery } : word)));
  }

  async function remove(item: SavedWord) {
    if (pendingDelete !== item.id) {
      setPendingDelete(item.id);
      return;
    }
    await deleteSavedWord(item.id);
    setPendingDelete(null);
    setWords((current) => current.filter((word) => word.id !== item.id));
  }

  return (
    <section className="page" id="panel-vocab" role="tabpanel" aria-labelledby="tab-vocab">
      <PageHeader title="生词库" />
      <label className="field">
        <span className="visually-hidden">搜索生词</span>
        <input
          className="search-input"
          type="search"
          value={query}
          placeholder="搜索单词或释义"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="segmented" role="group" aria-label="学习状态">
        {filters.map((item) => (
          <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {words.length === 0 ? <p className="empty">还没有保存的单词。</p> : null}
      {words.length > 0 && visible.length === 0 ? <p className="empty">没有匹配的单词。</p> : null}
      <ul className="vocab-list">
        {visible.map((item) => (
          <li key={item.id} className="vocab-row">
            <button type="button" className="vocab-open" onClick={() => onOpenWord(item.word)}>
              {item.word}
            </button>
            <p>
              {item.story.pos} · {item.story.gloss}
            </p>
            <div className="vocab-actions">
              <select
                aria-label={`${item.word} 的学习状态`}
                value={item.mastery}
                onChange={(event) => void changeMastery(item, event.target.value as Mastery)}
              >
                <option value="new">未学习</option>
                <option value="learning">学习中</option>
                <option value="mastered">已掌握</option>
              </select>
              <button type="button" className="button secondary" onClick={() => void remove(item)}>
                {pendingDelete === item.id ? `确认删除 ${item.word}` : `删除 ${item.word}`}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
