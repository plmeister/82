import { writable } from "svelte/store";
import type { GameState, GameEvent } from "$lib/core/types";
import { reduce } from "$lib/core/reducer";
import { Chess } from "chess.js";

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

    dispatch(event: GameEvent) {
      update((state) => reduce(state, event));
    },

    reset() {
      set(initial);
    },
  };
}

export const game = createGameStore();
