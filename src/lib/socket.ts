import { io, type Socket } from "socket.io-client";
import type {
  ChatMessage,
  SocketAckResponse,
  SocketChatErrorPayload,
} from "../features/chat/types/chat.types";

export interface ServerToClientEvents {
  joined_room: (payload: { matchId: string }) => void;
  receive_message: (message: ChatMessage) => void;
  chat_error: (payload: SocketChatErrorPayload) => void;
}

export interface ClientToServerEvents {
  join_match_room: (
    matchId: string,
    ack?: (response: SocketAckResponse<{ matchId: string }>) => void,
  ) => void;
  leave_match_room: (
    matchId: string,
    ack?: (response: SocketAckResponse<{ matchId: string }>) => void,
  ) => void;
  send_message: (
    payload: { matchId: string; content: string },
    ack?: (response: SocketAckResponse<ChatMessage>) => void,
  ) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function resolveSocketBaseUrl(): string {
  const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
  const candidate =
    typeof rawSocketUrl === "string" && rawSocketUrl.trim().length > 0
      ? rawSocketUrl.trim()
      : import.meta.env.VITE_API_URL?.trim();

  if (!candidate) {
    throw new Error(
      "No se encontró VITE_SOCKET_URL ni VITE_API_URL para conectar con el servidor de chat.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error("La URL configurada para Socket.IO no es válida.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("La URL de Socket.IO debe utilizar protocolo HTTP o HTTPS.");
  }

  // Always connect to the server origin without the REST `/api` path prefix
  return parsed.origin;
}

export function createChatSocket(
  getToken: () => string | null,
): ChatSocket {
  const socketUrl = resolveSocketBaseUrl();

  return io(socketUrl, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: (cb) => {
      const token = getToken();
      cb({ token: token ?? "" });
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}

