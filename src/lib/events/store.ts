import { writable, get } from "svelte/store";
import type { GameState, GameEvent } from "$lib/core/types";
import { reduce } from "$lib/core/reducer";
import { Chess } from "chess.js";
import { maybeTriggerEngineMove } from "$lib/game/orchestrator";

const initial: GameState = {
  id: crypto.randomUUID(),
  fen: new Chess().fen(),
  events: [],
  turn: "w",
};

function createGameStore() {
  const { subscribe, update, set } = writable(initial);

  return {
    subscribe,

    get() {
      return get({ subscribe });
    },

    dispatch(event: GameEvent) {
      let latestFen = "";

      update((state) => {
        const next = reduce(state, event);
        latestFen = next.fen;
        return next;
      });

      if (event.type === "MOVE") {
        queueMicrotask(() => {
          maybeTriggerEngineMove(latestFen);
        });
      }
    },

    reset() {
      set(initial);
    },
  };
}

export const game = createGameStore();
