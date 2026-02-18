import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const RECENT_EMOJIS_KEY = "chat_recent_emojis_v1";
const SKIN_TONE_KEY = "chat_emoji_skin_tone_v1";
const MAX_RECENT_EMOJIS = 24;
const SKIN_TONE_SWATCHES = [
  "\ud83d\udc4d",
  "\ud83d\udc4d\ud83c\udffb",
  "\ud83d\udc4d\ud83c\udffc",
  "\ud83d\udc4d\ud83c\udffd",
  "\ud83d\udc4d\ud83c\udffe",
  "\ud83d\udc4d\ud83c\udfff",
];
const EMOJI_CATEGORIES = [
  "frequent",
  "people",
  "nature",
  "foods",
  "places",
  "activity",
  "objects",
  "symbols",
  "flags",
];

function readRecentEmojis() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((emoji) => typeof emoji === "string" && emoji.length > 0);
  } catch {
    return [];
  }
}

function readSkinTone() {
  const raw = Number(localStorage.getItem(SKIN_TONE_KEY));
  return Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 1;
}

function persistRecentEmojis(emojis) {
  localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(emojis));
}

function persistSkinTone(value) {
  localStorage.setItem(SKIN_TONE_KEY, String(value));
}

function toNativeEmoji(emojiData) {
  if (emojiData?.native) {
    return emojiData.native;
  }

  if (emojiData?.skins?.length > 0) {
    return emojiData.skins[0].native;
  }

  return "";
}

function containsTarget(ref, target) {
  return Boolean(ref?.current && target instanceof Node && ref.current.contains(target));
}

export default function EmojiPickerPanel({ isOpen, theme, anchorRef, onClose, onEmojiSelect }) {
  const panelRef = useRef(null);
  const [PickerComponent, setPickerComponent] = useState(null);
  const [emojiData, setEmojiData] = useState(null);
  const [recentEmojis, setRecentEmojis] = useState(readRecentEmojis);
  const [skinTone, setSkinTone] = useState(readSkinTone);
  const [panelTab, setPanelTab] = useState("emoji");

  useEffect(() => {
    if (!isOpen || (PickerComponent && emojiData)) {
      return;
    }

    let cancelled = false;

    const loadPicker = async () => {
      const [{ default: Picker }, dataModule] = await Promise.all([
        import("@emoji-mart/react"),
        import("@emoji-mart/data"),
      ]);

      if (cancelled) {
        return;
      }

      setPickerComponent(() => Picker);
      setEmojiData(dataModule.default || dataModule);
    };

    loadPicker().catch((error) => {
      console.error("Failed to load emoji picker:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [emojiData, isOpen, PickerComponent]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event) => {
      if (containsTarget(panelRef, event.target) || containsTarget(anchorRef, event.target)) {
        return;
      }
      onClose();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, isOpen, onClose]);

  const addToRecent = useCallback((emoji) => {
    setRecentEmojis((previous) => {
      const next = [emoji, ...previous.filter((item) => item !== emoji)].slice(0, MAX_RECENT_EMOJIS);
      persistRecentEmojis(next);
      return next;
    });
  }, []);

  const handleEmojiSelect = useCallback(
    (emojiDataItem) => {
      const emoji = toNativeEmoji(emojiDataItem);
      if (!emoji) {
        return;
      }

      addToRecent(emoji);
      onEmojiSelect(emoji);
    },
    [addToRecent, onEmojiSelect],
  );

  const handleRecentEmojiInsert = useCallback(
    (emoji) => {
      addToRecent(emoji);
      onEmojiSelect(emoji);
    },
    [addToRecent, onEmojiSelect],
  );

  const handleSkinToneChange = useCallback((tone) => {
    setSkinTone(tone);
    persistSkinTone(tone);
  }, []);

  const handleCycleSkinTone = useCallback(() => {
    const next = skinTone >= 6 ? 1 : skinTone + 1;
    handleSkinToneChange(next);
  }, [handleSkinToneChange, skinTone]);

  const recentButtons = useMemo(() => recentEmojis.slice(0, 12), [recentEmojis]);

  if (!isOpen) {
    return null;
  }

  return (
    <section
      className="wa-emoji-sheet"
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Emoji picker panel"
    >
      <header className="wa-emoji-recent-header">
        <span>Recent</span>
        <div className="wa-emoji-recent-list" role="list">
          {recentButtons.length === 0 && <span className="wa-emoji-recent-empty">No recent emojis</span>}
          {recentButtons.map((emoji) => (
            <button
              key={`recent-${emoji}`}
              type="button"
              className="wa-emoji-recent-btn"
              onClick={() => handleRecentEmojiInsert(emoji)}
              aria-label={`Insert recent emoji ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="wa-emoji-skin-btn"
          onClick={handleCycleSkinTone}
          aria-label={`Change skin tone, current tone ${skinTone}`}
          title="Change skin tone"
        >
          {SKIN_TONE_SWATCHES[skinTone - 1]}
        </button>
      </header>

      <div className="wa-emoji-body">
        {panelTab === "emoji" ? (
          PickerComponent && emojiData ? (
            <PickerComponent
              data={emojiData}
              onEmojiSelect={handleEmojiSelect}
              theme={theme === "light" ? "light" : "dark"}
              autoFocus
              dynamicWidth
              searchPosition="sticky"
              navPosition="top"
              previewPosition="none"
              skin={skinTone}
              skinTonePosition="none"
              onSkinToneChange={handleSkinToneChange}
              categories={EMOJI_CATEGORIES}
              maxFrequentRows={2}
              set="native"
            />
          ) : (
            <div className="wa-emoji-loading">Loading emojis...</div>
          )
        ) : (
          <div className="wa-emoji-loading">
            {panelTab === "gif" ? "GIF picker coming soon" : "Sticker picker coming soon"}
          </div>
        )}
      </div>

      <footer className="wa-emoji-footer">
        <button
          type="button"
          className={`wa-emoji-footer-btn ${panelTab === "emoji" ? "active" : ""}`}
          onClick={() => setPanelTab("emoji")}
          aria-label="Emoji tab"
        >
          {"\ud83d\ude42"}
        </button>
        <button
          type="button"
          className={`wa-emoji-footer-btn ${panelTab === "gif" ? "active" : ""}`}
          onClick={() => setPanelTab("gif")}
          aria-label="GIF tab"
        >
          GIF
        </button>
        <button
          type="button"
          className={`wa-emoji-footer-btn ${panelTab === "sticker" ? "active" : ""}`}
          onClick={() => setPanelTab("sticker")}
          aria-label="Sticker tab"
        >
          {"\ud83c\udf1f"}
        </button>
      </footer>
    </section>
  );
}
