import {
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { MAX_CHAT_MESSAGE_LENGTH } from "../services/chat.service";
import type { SendMessageResult } from "../types/chat.types";

interface MessageComposerProps {
  isConnected: boolean;
  isSending: boolean;
  feedback: { tone: "error" | "warning"; message: string } | null;
  onSend: (content: string) => Promise<SendMessageResult>;
  onClearFeedback: () => void;
}

export default function MessageComposer({
  isConnected,
  isSending,
  feedback,
  onSend,
  onClearFeedback,
}: MessageComposerProps): ReactElement {
  const [text, setText] = useState<string>("");

  const trimmedLength = text.trim().length;
  const remaining = MAX_CHAT_MESSAGE_LENGTH - text.length;
  const canSubmit =
    isConnected &&
    !isSending &&
    trimmedLength > 0 &&
    text.length <= MAX_CHAT_MESSAGE_LENGTH;

  const submitCurrentText = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }

    const result = await onSend(text);
    // Clear composer ONLY when server explicitly confirms persistence
    if (result.outcome === "confirmed") {
      setText("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitCurrentText();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitCurrentText();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-[#E7E2D6] bg-white px-4 py-3 sm:px-5"
    >
      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`mb-2.5 rounded-lg px-3 py-2 text-xs ${
            feedback.tone === "error"
              ? "border border-[#C17A4D]/40 bg-[#C17A4D]/10 text-[#8C4D27]"
              : "border border-[#1F2A2E]/20 bg-[#1F2A2E]/5 text-[#1F2A2E]"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex items-end gap-2.5">
        <div className="flex-1">
          <label htmlFor="chat-message-input" className="sr-only">
            Escribe un mensaje
          </label>
          <textarea
            id="chat-message-input"
            rows={2}
            value={text}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onChange={(e) => {
              setText(e.target.value);
              if (feedback) {
                onClearFeedback();
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={!isConnected || isSending}
            placeholder={
              isConnected
                ? "Escribe un mensaje... (Enter para enviar)"
                : "Esperando conexión para enviar mensajes..."
            }
            className="w-full resize-none rounded-xl border border-[#E7E2D6] bg-[#FBF9F5] px-3.5 py-2.5 text-sm text-[#1C2321] placeholder:text-[#A8A296] outline-none transition focus:border-[#C17A4D] focus:bg-white focus:ring-2 focus:ring-[#C17A4D]/20 disabled:opacity-60"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#74716A]">
            <span>Shift + Enter para salto de línea</span>
            <span className={remaining < 100 ? "text-[#8C4D27] font-medium" : ""}>
              {text.length} / {MAX_CHAT_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isSending}
          className="mb-5 shrink-0 rounded-xl bg-[#C17A4D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A6613A] focus:outline-none focus:ring-2 focus:ring-[#C17A4D]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}

