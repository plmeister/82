import { game } from "$lib/events/store";
import { requestMove } from "$lib/engines/stockfish";

let lastFen: string | null = null;

game.subscribe((state) => {
  if (state.turn !== "b") return;
  if (state.fen === lastFen) return;

  lastFen = state.fen;
  requestMove(state.fen);
});
