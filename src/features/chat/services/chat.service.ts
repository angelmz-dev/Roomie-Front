import { apiClient } from "../../../lib/axios";
import { normalizeApiError } from "../../../lib/api-error";
import type {
  ChatHistoryQueryParams,
  ChatHistoryResponse,
  ChatMessage,
} from "../types/chat.types";

export const DEFAULT_CHAT_HISTORY_LIMIT = 20;
export const MAX_CHAT_MESSAGE_LENGTH = 1000;

export function compareMessagesChronologically(
  a: ChatMessage,
  b: ChatMessage,
): number {
  const timeA = Date.parse(a.createdAt);
  const timeB = Date.parse(b.createdAt);

  if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
    return timeA - timeB;
  }

  return a.id.localeCompare(b.id);
}

/**
 * Deterministically merges two message lists, deduplicating by message `id`
 * and sorting chronologically by `(createdAt ASC, id ASC)`.
 */
export function mergeChatMessages(
  existing: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
): ChatMessage[] {
  if (incoming.length === 0) {
    return [...existing];
  }

  const byId = new Map<string, ChatMessage>();
  for (const msg of existing) {
    byId.set(msg.id, msg);
  }
  for (const msg of incoming) {
    byId.set(msg.id, msg);
  }

  return Array.from(byId.values()).sort(compareMessagesChronologically);
}

export async function getChatHistory(
  matchId: string,
  params?: ChatHistoryQueryParams,
): Promise<ChatHistoryResponse> {
  const queryParams: Record<string, string | number> = {
    limit: params?.limit ?? DEFAULT_CHAT_HISTORY_LIMIT,
  };

  if (params?.before && params?.beforeId) {
    queryParams.before = params.before;
    queryParams.beforeId = params.beforeId;
  } else {
    queryParams.page = params?.page ?? 1;
  }

  try {
    const { data } = await apiClient.get<ChatHistoryResponse>(
      `/chat/${encodeURIComponent(matchId)}/messages`,
      { params: queryParams },
    );
    return data;
  } catch (error: unknown) {
    throw normalizeApiError(
      error,
      "No se pudo cargar el historial de mensajes.",
    );
  }
}

