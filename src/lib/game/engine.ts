import { Chess } from "chess.js";

export type EngineMove = {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
};

export async function getEngineMove(fen: string): Promise<EngineMove> {
  const chess = new Chess(fen);

  const moves = chess.moves({ verbose: true });

  if (moves.length === 0) {
    throw new Error("No legal moves");
  }

  const pick = moves[Math.floor(Math.random() * moves.length)];

  // chess.js sometimes gives "p" etc; we sanitize
  const promo =
    pick.promotion && ["q", "r", "b", "n"].includes(pick.promotion)
      ? (pick.promotion as EngineMove["promotion"])
      : undefined;

  return {
    from: pick.from,
    to: pick.to,
    promotion: promo,
  };
}
