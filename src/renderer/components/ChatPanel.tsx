import { useState, useRef, useEffect, useMemo } from "react";
import type { ChatMessage } from "../lib/types";

// Standard Meshtastic emoji reactions (matching mobile app conventions)
const REACTION_EMOJIS = [
  { code: 128077, label: "\ud83d\udc4d" }, // thumbs up
  { code: 10084, label: "\u2764\ufe0f" },   // red heart
  { code: 128514, label: "\ud83d\ude02" }, // face with tears of joy
  { code: 128078, label: "\ud83d\udc4e" }, // thumbs down
  { code: 127881, label: "\ud83c\udf89" }, // party popper
];

/** Convert a Unicode codepoint to an emoji string */
function emojiFromCode(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "\u2753";
  }
}

interface Props {
  messages: ChatMessage[];
  channels: Array<{ index: number; name: string }>;
  myNodeNum: number;
  onSend: (text: string, channel: number) => Promise<void>;
  onReact: (emoji: number, replyId: number, channel: number) => Promise<void>;
  onNodeClick: (nodeNum: number) => void;
  isConnected: boolean;
}

export default function ChatPanel({
  messages,
  channels,
  myNodeNum,
  onSend,
  onReact,
  onNodeClick,
  isConnected,
}: Props) {
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState(0);
  const [sending, setSending] = useState(false);
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Separate regular messages from reaction messages
  const { regularMessages, reactionsByReplyId } = useMemo(() => {
    const regular: ChatMessage[] = [];
    const reactions = new Map<
      number,
      Array<{ emoji: number; sender_name: string }>
    >();

    for (const msg of messages) {
      if (msg.emoji && msg.replyId) {
        const existing = reactions.get(msg.replyId) || [];
        existing.push({ emoji: msg.emoji, sender_name: msg.sender_name });
        reactions.set(msg.replyId, existing);
      } else {
        regular.push(msg);
      }
    }
    return { regularMessages: regular, reactionsByReplyId: reactions };
  }, [messages]);

  const filteredMessages = regularMessages.filter(
    (m) => channel === -1 || m.channel === channel
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages.length]);

  // Close picker on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpenFor(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !isConnected || sending) return;
    setSending(true);
    try {
      const sendChannel = channel === -1 ? 0 : channel;
      await onSend(input.trim(), sendChannel);
      setInput("");
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (
    emojiCode: number,
    packetId: number,
    msgChannel: number
  ) => {
    setPickerOpenFor(null);
    try {
      await onReact(emojiCode, packetId, msgChannel);
    } catch (err) {
      console.error("React failed:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /** Group reactions by emoji code for a given packetId */
  function getGroupedReactions(packetId: number | undefined) {
    if (!packetId) return [];
    const reactions = reactionsByReplyId.get(packetId);
    if (!reactions) return [];

    const grouped = new Map<number, string[]>();
    for (const r of reactions) {
      const existing = grouped.get(r.emoji) || [];
      existing.push(r.sender_name);
      grouped.set(r.emoji, existing);
    }
    return Array.from(grouped.entries()).map(([emoji, senders]) => ({
      emoji,
      count: senders.length,
      tooltip: senders.join(", "),
    }));
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-10rem)]">
      {/* Channel selector — pill buttons */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setChannel(-1)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            channel === -1
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-400 hover:text-gray-200"
          }`}
        >
          All
        </button>
        {channels.map((ch) => (
          <button
            key={ch.index}
            onClick={() => setChannel(ch.index)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              channel === ch.index
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {ch.name}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-800/50 rounded-xl p-3 space-y-1.5 min-h-0">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            {isConnected
              ? "No messages yet. Send one or wait for incoming messages."
              : "Connect to a device to start chatting."}
          </div>
        ) : (
          filteredMessages.map((msg, i) => {
            const isOwn = msg.sender_id === myNodeNum;
            const reactions = getGroupedReactions(msg.packetId);
            const showPicker =
              pickerOpenFor === (msg.packetId ?? -(i + 1));

            return (
              <div
                key={`${msg.timestamp}-${i}`}
                className={`flex flex-col ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble row: bubble + inline reaction trigger */}
                <div
                  className={`group/msg flex items-end gap-1 max-w-[80%] ${
                    isOwn ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-3 py-2 min-w-0 ${
                      isOwn
                        ? "rounded-br-sm bg-blue-600/20 border border-blue-500/30"
                        : "rounded-bl-sm bg-gray-700/50 border border-gray-600/30"
                    }`}
                  >
                    {/* Header: sender name (clickable) + time */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <button
                        onClick={() => onNodeClick(msg.sender_id)}
                        className={`text-xs font-semibold cursor-pointer hover:underline ${
                          isOwn ? "text-blue-400" : "text-green-400"
                        }`}
                      >
                        {msg.sender_name}
                      </button>
                      <span className="text-[10px] text-gray-500/70">
                        {formatTime(msg.timestamp)}
                      </span>
                      {channels.length > 1 && (
                        <span className="text-[10px] text-gray-600">
                          ch{msg.channel}
                        </span>
                      )}
                    </div>

                    {/* Message text */}
                    <p className="text-sm text-gray-200 break-words leading-relaxed">
                      {msg.payload}
                    </p>

                    {/* Delivery status for own messages */}
                    {isOwn && msg.status && (
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {msg.status === "sending" && (
                          <span
                            className="text-[10px] text-gray-500"
                            title="Sending..."
                          >
                            ⏳
                          </span>
                        )}
                        {msg.status === "acked" && (
                          <span
                            className="text-[10px] text-green-500"
                            title="Delivered"
                          >
                            ✓
                          </span>
                        )}
                        {msg.status === "failed" && (
                          <span
                            className="text-[10px] text-red-400 cursor-help"
                            title={msg.error || "Failed to deliver"}
                          >
                            ✗ {msg.error || "Failed"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline reaction trigger — visible on hover */}
                  {isConnected && msg.packetId && (
                    <button
                      onClick={() =>
                        setPickerOpenFor(
                          showPicker
                            ? null
                            : (msg.packetId ?? -(i + 1))
                        )
                      }
                      className="opacity-0 group-hover/msg:opacity-100 text-gray-600 hover:text-gray-300 text-xs p-1 rounded transition-all shrink-0"
                      title="React"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Emoji picker — normal flow below the row */}
                {showPicker && (
                  <div
                    className={`flex gap-1 bg-gray-700 border border-gray-600 rounded-xl px-2 py-1.5 mt-1 shadow-lg ${
                      isOwn ? "self-end" : "self-start"
                    }`}
                  >
                    {REACTION_EMOJIS.map((re) => (
                      <button
                        key={re.code}
                        onClick={() =>
                          handleReact(
                            re.code,
                            msg.packetId!,
                            msg.channel
                          )
                        }
                        className="hover:scale-125 transition-transform text-lg px-0.5"
                        title={re.label}
                      >
                        {re.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reaction badges */}
                {reactions.length > 0 && (
                  <div
                    className={`flex gap-1 mt-0.5 ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    {reactions.map((r) => (
                      <span
                        key={r.emoji}
                        className="inline-flex items-center gap-0.5 bg-gray-700/80 border border-gray-600/50 rounded-full px-1.5 py-0.5 text-xs cursor-default"
                        title={r.tooltip}
                      >
                        {emojiFromCode(r.emoji)}
                        {r.count > 1 && (
                          <span className="text-gray-400 text-[10px]">
                            {r.count}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected || sending}
          placeholder={
            isConnected ? "Type a message..." : "Connect to send messages"
          }
          className="flex-1 px-4 py-2.5 bg-gray-700/80 rounded-xl text-gray-200 border border-gray-600/50 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 focus:outline-none disabled:opacity-50 transition-colors"
          maxLength={228}
        />
        <button
          onClick={handleSend}
          disabled={!isConnected || !input.trim() || sending}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
      {/* Character count — only show near limit */}
      {input.length > 180 && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {input.length}/228
        </div>
      )}
    </div>
  );
}
