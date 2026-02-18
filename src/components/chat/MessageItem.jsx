import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactionBar from "./ReactionBar";

const LONG_PRESS_MS = 420;

function getUserId(user) {
  if (!user) {
    return "";
  }

  if (typeof user === "string") {
    return user;
  }

  return user._id || "";
}

function buildReactionSummary(reactions, currentUserId) {
  const aggregate = new Map();

  reactions.forEach((reaction) => {
    const key = reaction.emoji;
    const entry = aggregate.get(key) || { emoji: key, count: 0, reactedByMe: false };
    entry.count += 1;
    if (getUserId(reaction.user) === currentUserId) {
      entry.reactedByMe = true;
    }
    aggregate.set(key, entry);
  });

  return Array.from(aggregate.values());
}

function MessageItem({ message, currentUserId, onReact, onOpenSenderProfile }) {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const longPressTimerRef = useRef(null);

  const senderId = getUserId(message.senderUserId);
  const isMine = senderId === currentUserId || senderId === "";
  const senderName = message.senderUserId?.username || "Unknown";

  const myReaction = useMemo(() => {
    return (message.reactions || []).find((reaction) => getUserId(reaction.user) === currentUserId)?.emoji || null;
  }, [currentUserId, message.reactions]);

  const reactionSummary = useMemo(() => {
    return buildReactionSummary(message.reactions || [], currentUserId);
  }, [currentUserId, message.reactions]);

  const onReactionSelect = useCallback(
    (emoji) => {
      onReact(message._id, emoji);
      setShowReactionBar(false);
    },
    [message._id, onReact],
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearLongPress();
    };
  }, [clearLongPress]);

  const onTouchStart = useCallback(() => {
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      setShowReactionBar(true);
    }, LONG_PRESS_MS);
  }, [clearLongPress]);

  const onTouchEnd = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  return (
    <article
      className={`message wa-message ${isMine ? "sent" : "received"}`}
      onMouseEnter={() => setShowReactionBar(true)}
      onMouseLeave={() => setShowReactionBar(false)}
      onFocus={() => setShowReactionBar(true)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) {
          return;
        }
        setShowReactionBar(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={clearLongPress}
      onTouchCancel={clearLongPress}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setShowReactionBar(false);
        }
      }}
      tabIndex={0}
      role="group"
      aria-label={`Message from ${isMine ? "you" : senderName}`}
    >
      {!isMine && (
        <button
          type="button"
          className="msg-sender msg-sender-button"
          onClick={() => onOpenSenderProfile?.(message.senderUserId)}
          aria-label={`Open ${senderName} profile`}
        >
          {senderName}
        </button>
      )}

      <div className="msg-bubble">
        <div className="glass-reflex" aria-hidden="true" />
        {message.messageContent}
        <span className="msg-time">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <ReactionBar visible={showReactionBar} activeEmoji={myReaction} onSelect={onReactionSelect} />

      {reactionSummary.length > 0 && (
        <div className="wa-reaction-summary" role="group" aria-label="Message reactions">
          {reactionSummary.map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              className={`wa-reaction-chip ${reaction.reactedByMe ? "mine" : ""}`}
              onClick={() => onReactionSelect(reaction.emoji)}
              aria-label={`Reaction ${reaction.emoji} with count ${reaction.count}`}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

const MemoMessageItem = memo(
  MessageItem,
  (prevProps, nextProps) =>
    prevProps.message === nextProps.message &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.onReact === nextProps.onReact &&
    prevProps.onOpenSenderProfile === nextProps.onOpenSenderProfile,
);

export default MemoMessageItem;
