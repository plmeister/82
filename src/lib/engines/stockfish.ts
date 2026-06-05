let worker: Worker | null = null;
let ready = false;
let queuedFen: string | null = null;

let onMoveCb: ((uci: string) => void) | null = null;

export function initStockfish(onMove: (uci: string) => void) {
  onMoveCb = onMove;

  worker = new Worker("/stockfish.js", { type: "module" });
  console.log("worker created");
  worker.onerror = (e) => {
    console.error("[SF WORKER ERROR]", e);
  };
  worker.onmessageerror = (e) => {
    console.error("[SF WORKER MESSAGE ERROR]", e);
  };

  worker.onmessage = (e) => {
    console.log("[SF RAW EVENT]", e);
    const line = typeof e.data === "string" ? e.data : "";
    console.log("[SF DATA TYPE]", typeof e.data);
    console.log("[SF DATA VALUE]", e.data);

    if (line === "uciok") return;

    if (line === "readyok") {
      ready = true;

      // flush queued request
      if (queuedFen) {
        requestMove(queuedFen);
        queuedFen = null;
      }
      return;
    }

    const match = line.match(/^bestmove\s+(\S+)/);
    if (match && onMoveCb) {
      onMoveCb(match[1]);
    }
  };

  worker.postMessage("uci");
  worker.postMessage("isready");
}

export function requestMove(fen: string, depth = 12) {
  console.log("requestMove");
  if (!worker) return;
  console.log("worker");
  if (!ready) {
    queuedFen = fen;
    worker.postMessage("isready");
    return;
  }

  console.log("requestMove ready");
  worker.postMessage(`position fen ${fen}`);
  worker.postMessage(`go depth ${depth}`);
}
