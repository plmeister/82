import { Chess } from "chess.js";
import { game } from "$lib/events/store";
import { initStockfish, requestMove } from "$lib/engines/stockfish";

let thinking = false;

// simple mode
export const mode: {
  type: "human-vs-human" | "human-vs-engine";
  engineSide: "w" | "b";
} = {
  type: "human-vs-engine",
  engineSide: "b",
};

let initialized = false;

function getTurn(fen: string) {
  return new Chess(fen).turn();
}

export function initEngine() {
  if (initialized) return;

  initStockfish((uci) => {
    console.log("engine made move");
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? (uci[4] as any) : undefined;

    game.dispatch({
      type: "MOVE",
      from,
      to,
      promotion,
      source: "stockfish",
    });
  });

  initialized = true;
  console.log("Engine initialised");
}

export async function maybeTriggerEngineMove(fen: string) {
  if (thinking) return;
  if (mode.type !== "human-vs-engine") return;

  const turn = getTurn(fen);
  if (turn !== mode.engineSide) return;

  initEngine();

  thinking = true;

  try {
    requestMove(fen, 12);
    console.log("maybe trigger engine move");
  } finally {
    thinking = false;
  }
}
