import { useEffect, useState } from "react";
import { VocabSwipeRow } from "../components/VocabSwipeRow";
import { PageHeader } from "../components/PageHeader";
import { OfflineNotice, useOnlineStatus } from "../lib/online";
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
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const online = useOnlineStatus();

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

  useEffect(() => {
    setOpenRowId(null);
    setPendingDelete(null);
  }, [query, filter]);

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

  function openRow(id: string) {
    setOpenRowId(id);
    setPendingDelete(null);
  }

  function closeRow() {
    setOpenRowId(null);
    setPendingDelete(null);
  }

  function requestDelete(id: string) {
    setOpenRowId(id);
    setPendingDelete(id);
  }

  function cancelDelete() {
    setPendingDelete(null);
    setOpenRowId(null);
  }

  async function confirmDelete(item: SavedWord) {
    await deleteSavedWord(item.id);
    setPendingDelete(null);
    setOpenRowId(null);
    setWords((current) => current.filter((word) => word.id !== item.id));
  }

  return (
    <section className="page" id="panel-vocab" role="tabpanel" aria-labelledby="tab-vocab">
      <PageHeader title="生词库" />
      <OfflineNotice online={online} />
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
          <VocabSwipeRow
            key={item.id}
            item={item}
            isOpen={openRowId === item.id}
            isPendingDelete={pendingDelete === item.id}
            onOpen={() => openRow(item.id)}
            onClose={closeRow}
            onRequestDelete={() => requestDelete(item.id)}
            onCancelDelete={cancelDelete}
            onConfirmDelete={() => void confirmDelete(item)}
            onOpenWord={onOpenWord}
            onChangeMastery={(mastery) => void changeMastery(item, mastery)}
          />
        ))}
      </ul>
    </section>
  );
}
