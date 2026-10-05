import { useRef, useState } from "react";
import type { Mastery, SavedWord } from "../lib/vocab";

const SWIPE_DELETE_WIDTH = 72;
const SWIPE_CONFIRM_WIDTH = 132;
const SWIPE_SNAP_THRESHOLD = 36;

type VocabSwipeRowProps = {
  item: SavedWord;
  isOpen: boolean;
  isPendingDelete: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onOpenWord: (word: string) => void;
  onChangeMastery: (mastery: Mastery) => void;
};

export function VocabSwipeRow({
  item,
  isOpen,
  isPendingDelete,
  onOpen,
  onClose,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onOpenWord,
  onChangeMastery,
}: VocabSwipeRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startOffset: number; tracking: boolean } | null>(null);

  const targetWidth = isOpen ? (isPendingDelete ? SWIPE_CONFIRM_WIDTH : SWIPE_DELETE_WIDTH) : 0;
  const displayOffset = dragging ? offset : targetWidth;

  function canStartSwipe(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return !target.closest("select, button, input, textarea, a");
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!canStartSwipe(event.target)) {
      return;
    }
    dragRef.current = {
      startX: event.clientX,
      startOffset: displayOffset,
      tracking: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const deltaX = drag.startX - event.clientX;
    if (!drag.tracking) {
      if (Math.abs(deltaX) < 8) {
        return;
      }
      drag.tracking = true;
      setDragging(true);
    }
    const maxWidth = isPendingDelete ? SWIPE_CONFIRM_WIDTH : SWIPE_DELETE_WIDTH;
    const next = Math.max(0, Math.min(maxWidth, drag.startOffset + deltaX));
    setOffset(next);
  }

  function finishSwipe(nextOffset: number) {
    if (nextOffset >= SWIPE_SNAP_THRESHOLD) {
      onOpen();
      return;
    }
    onClose();
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.tracking) {
      return;
    }
    setDragging(false);
    const deltaX = drag.startX - event.clientX;
    const maxWidth = isPendingDelete ? SWIPE_CONFIRM_WIDTH : SWIPE_DELETE_WIDTH;
    const nextOffset = Math.max(0, Math.min(maxWidth, drag.startOffset + deltaX));
    finishSwipe(nextOffset);
    setOffset(0);
  }

  function onPointerCancel() {
    dragRef.current = null;
    setDragging(false);
    setOffset(0);
  }

  return (
    <li className="vocab-swipe-item">
      <div
        className="vocab-swipe-actions"
        style={{ width: isPendingDelete ? SWIPE_CONFIRM_WIDTH : SWIPE_DELETE_WIDTH }}
      >
        {isPendingDelete ? (
          <>
            <button type="button" className="vocab-swipe-action cancel" aria-label="取消" onClick={onCancelDelete}>
              取消
            </button>
            <button type="button" className="vocab-swipe-action confirm" aria-label="确认删除" onClick={onConfirmDelete}>
              删除
            </button>
          </>
        ) : (
          <button type="button" className="vocab-swipe-action delete" aria-label="删除" onClick={onRequestDelete}>
            删除
          </button>
        )}
      </div>
      <div
        className={dragging ? "vocab-swipe-panel is-dragging" : "vocab-swipe-panel"}
        style={{ transform: `translateX(-${displayOffset}px)` }}
        data-testid={`vocab-swipe-panel-${item.word}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="vocab-row">
          <div className="vocab-main">
            <button type="button" className="vocab-open" onClick={() => onOpenWord(item.word)}>
              {item.word}
            </button>
            <p>
              {item.story.pos} · {item.story.gloss}
            </p>
          </div>
          <div className="vocab-actions">
            <select
              aria-label={`${item.word} 的学习状态`}
              value={item.mastery}
              onChange={(event) => onChangeMastery(event.target.value as Mastery)}
            >
                <option value="new">未学习</option>
                <option value="mastered">已掌握</option>
            </select>
          </div>
        </div>
      </div>
    </li>
  );
}
