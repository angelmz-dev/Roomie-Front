import type { ApiSuccessResponse } from "../../../types/api.types";

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatHistoryMeta {
  page: number;
  limit: number;
  returned: number;
  hasMore: boolean;
}

export interface ChatHistoryResponse extends ApiSuccessResponse<ChatMessage[]> {
  meta: ChatHistoryMeta;
}

export interface ChatHistoryQueryParams {
  page?: number;
  limit?: number;
  before?: string;
  beforeId?: string;
}

export type ChatConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type ChatHistoryStatus = "idle" | "loading" | "ready" | "error";

export type SocketErrorCode =
  | "TOKEN_EXPIRED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_PAYLOAD"
  | "STALE_OPERATION"
  | "SEND_FAILED";

export type SocketAckResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: SocketErrorCode };

export interface SocketChatErrorPayload {
  message: string;
  code?: SocketErrorCode;
}

export type SendMessageOutcome = "confirmed" | "rejected" | "uncertain";

export interface SendMessageResult {
  outcome: SendMessageOutcome;
  feedback: string | null;
}

