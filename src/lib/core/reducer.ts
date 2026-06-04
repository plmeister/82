import { Chess } from "chess.js";
import type { GameState, GameEvent } from "./types";

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "MOVE": {
      const chess = new Chess(state.fen);

      const move = chess.move({
        from: event.from,
        to: event.to,
        promotion: "q",
      });

      if (!move) return state; // IMPORTANT: no mutation

      return {
        ...state,
        fen: chess.fen(),
        events: [...state.events, event],
        turn: chess.turn(),
      };
    }

    case "RESET":
      return {
        ...state,
        fen: new Chess().fen(),
        events: [],
        turn: "w",
        id: crypto.randomUUID(),
      };
  }
}
