import { WS_BASE_URL } from "./api";

type SocketListener = (payload: unknown) => void;

export class MatchSocket {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private listeners = new Map<string, Set<SocketListener>>();
  private matchId: string | null = null;

  connect(matchId: string) {
    this.matchId = matchId;
    this.cleanup();

    const socket = new WebSocket(`${WS_BASE_URL}/ws?matchId=${matchId}`);
    this.socket = socket;

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { event: string; data: unknown };
      const handlers = this.listeners.get(payload.event);
      handlers?.forEach((listener) => listener(payload.data));
    };

    socket.onclose = () => {
      this.socket = null;

      if (this.matchId) {
        this.reconnectTimer = window.setTimeout(() => this.connect(this.matchId!), 1500);
      }
    };
  }

  on(event: string, listener: SocketListener) {
    const handlers = this.listeners.get(event) ?? new Set<SocketListener>();
    handlers.add(listener);
    this.listeners.set(event, handlers);

    return () => {
      const current = this.listeners.get(event);
      current?.delete(listener);
    };
  }

  disconnect() {
    this.matchId = null;
    this.cleanup();
  }

  private cleanup() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      this.socket.close();
    }
  }
}

export const matchSocket = new MatchSocket();
