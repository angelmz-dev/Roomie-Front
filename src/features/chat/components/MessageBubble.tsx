import type { ReactElement } from "react";
import type { ChatMessage } from "../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatMessageTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MessageBubble({
  message,
  isOwn,
}: MessageBubbleProps): ReactElement {
  const formattedTime = formatMessageTimestamp(message.createdAt);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 shadow-xs ${
          isOwn
            ? "bg-[#1F2A2E] text-[#FBF9F5] rounded-br-sm"
            : "bg-white border border-[#E7E2D6] text-[#1C2321] rounded-bl-sm"
        }`}
      >
        {/* Rendered strictly as plain text, never as HTML */}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>
        {formattedTime && (
          <time
            dateTime={message.createdAt}
            className={`mt-1 block text-right text-[10px] ${
              isOwn ? "text-[#FBF9F5]/65" : "text-[#74716A]"
            }`}
          >
            {formattedTime}
          </time>
        )}
      </div>
    </div>
  );
}

