import { memo } from "react";

const QUICK_REACTIONS = [
  "\u2764\ufe0f",
  "\ud83d\ude02",
  "\ud83d\ude2e",
  "\ud83d\ude22",
  "\ud83d\ude21",
  "\ud83d\udc4d",
];

function ReactionBar({ visible, activeEmoji, onSelect }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="wa-reaction-bar" role="toolbar" aria-label="React to message">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={`wa-reaction-option ${activeEmoji === emoji ? "active" : ""}`}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => onSelect(emoji)}
          aria-label={`React with ${emoji}`}
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default memo(ReactionBar);
