type MatchSocketEvent =
  | {
      event: "match:start";
      data: unknown;
    }
  | {
      event: "score:update";
      data: unknown;
    };

type MatchSocket = {
  data: {
    matchId?: string;
  };
  send: (message: string) => void;
};

export class MatchGateway {
  private readonly rooms = new Map<string, Set<MatchSocket>>();

  subscribe(socket: MatchSocket, matchId: string) {
    socket.data.matchId = matchId;

    const room = this.rooms.get(matchId) ?? new Set<MatchSocket>();
    room.add(socket);
    this.rooms.set(matchId, room);
  }

  unsubscribe(socket: MatchSocket) {
    const matchId = socket.data.matchId;

    if (!matchId) {
      return;
    }

    const room = this.rooms.get(matchId);

    if (!room) {
      return;
    }

    room.delete(socket);

    if (room.size === 0) {
      this.rooms.delete(matchId);
    }
  }

  emit(matchId: string, payload: MatchSocketEvent) {
    const room = this.rooms.get(matchId);

    if (!room) {
      return;
    }

    const message = JSON.stringify(payload);
    room.forEach((socket) => socket.send(message));
  }
}

export const matchGateway = new MatchGateway();
