let worker: Worker;

export function initStockfish(onMove: (uci: string) => void) {
  worker = new Worker("/stockfish/stockfish.js");

  worker.onmessage = (e) => {
    const line = e.data;

    if (typeof line !== "string") return;

    const match = line.match(/^bestmove\s+(\S+)/);
    if (!match) return;

    onMove(match[1]);
  };

  worker.postMessage("uci");
  worker.postMessage("isready");
}

export function requestMove(fen: string, depth = 10) {
  worker.postMessage(`position fen ${fen}`);
  worker.postMessage(`go depth ${depth}`);
}
