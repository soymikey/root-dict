import type { WordStory } from "./story";

export type Mastery = "new" | "learning" | "mastered";

export type SavedWord = {
  id: string;
  word: string;
  story: WordStory;
  mastery: Mastery;
  savedAt: number;
  updatedAt: number;
};

const DB_NAME = "understanding-dictionary";
const STORE = "words";

export function wordId(word: string) {
  return word.trim().toLowerCase();
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    const value = await requestResult(run(tx.objectStore(STORE)));
    await done;
    return value;
  } finally {
    db.close();
  }
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSavedWord(word: string) {
  const record = await withStore<SavedWord | undefined>("readonly", (store) => store.get(wordId(word)));
  return record ?? null;
}

export async function listSavedWords() {
  const records = await withStore<SavedWord[]>("readonly", (store) => store.getAll());
  return records.sort((left, right) => right.savedAt - left.savedAt);
}

export async function saveWord(story: WordStory): Promise<"saved" | "duplicate"> {
  const existing = await getSavedWord(story.word);
  if (existing) {
    return "duplicate";
  }
  const now = Date.now();
  const record: SavedWord = {
    id: wordId(story.word),
    word: story.word.trim(),
    story,
    mastery: "new",
    savedAt: now,
    updatedAt: now,
  };
  await withStore("readwrite", (store) => store.add(record));
  return "saved";
}

export async function updateSavedStory(word: string, story: WordStory) {
  const existing = await getSavedWord(word);
  if (!existing) {
    return;
  }
  const next: SavedWord = {
    ...existing,
    word: story.word.trim() || existing.word,
    story,
    updatedAt: Date.now(),
  };
  await withStore("readwrite", (store) => store.put(next));
}

export async function setSavedMastery(word: string, mastery: Mastery) {
  const existing = await getSavedWord(word);
  if (!existing) {
    return;
  }
  await withStore("readwrite", (store) => store.put({ ...existing, mastery, updatedAt: Date.now() }));
}

export async function deleteSavedWord(word: string) {
  await withStore("readwrite", (store) => store.delete(wordId(word)));
}
