<script lang="ts">
  import { pieces } from "$lib/ui/pieces";

  type Piece = {
    color: "w" | "b";
    type: string;
  };

  type Vec = { x: number; y: number };

  type Props = {
    boardEl: HTMLElement;
    draggingFrom: string;
    legalMoves: string[];
    piece: Piece;
    squareSize: number;
    dragStartXY: Vec;
  };

  let {
    boardEl,
    draggingFrom,
    legalMoves,
    piece,
    squareSize,
    dragStartXY,
  }: Props = $props();

  let rect = $state<DOMRect | null>(null);

  let pointer = $state<Vec>({ x: 0, y: 0 });
  let ghost = $state<Vec>(dragStartXY); // 🔥 FIX: correct initial position

  let raf = 0;

  function updateRect() {
    rect = boardEl.getBoundingClientRect();
  }

  function clientToBoard(e: PointerEvent): Vec | null {
    if (!rect) return null;

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function squareToXY(square: string): Vec {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);

    return {
      x: file * squareSize + squareSize / 2,
      y: rank * squareSize + squareSize / 2,
    };
  }

  function dist(a: Vec, b: Vec) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function nearestSnap() {
    if (!legalMoves.length) return null;

    let best: string | null = null;
    let bestD = Infinity;

    for (const sq of legalMoves) {
      const c = squareToXY(sq);
      const d = dist(pointer, c);

      if (d < bestD) {
        bestD = d;
        best = sq;
      }
    }

    if (!best) return null;

    return {
      pos: squareToXY(best),
      distance: bestD,
    };
  }

  function onPointerMove(e: PointerEvent) {
    const p = clientToBoard(e);
    if (!p) return;
    pointer = p;
  }

  function tick() {
    if (draggingFrom && piece) {
      const snap = nearestSnap();

      const target =
        snap && snap.distance < squareSize * 0.75 ? snap.pos : pointer;

      ghost = {
        x: ghost.x + (target.x - ghost.x) * 0.35,
        y: ghost.y + (target.y - ghost.y) * 0.35,
      };
    }

    raf = requestAnimationFrame(tick);
  }

  $effect(() => {
    updateRect();

    const ro = new ResizeObserver(updateRect);
    ro.observe(boardEl);

    window.addEventListener("pointermove", onPointerMove);

    raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
    };
  });

  const sprite = $derived(pieces[piece.color + piece.type]);
</script>

<img
  class="ghost"
  src={sprite}
  style="
    transform: translate(
      calc({ghost.x}px - {squareSize / 2}px),
      calc({ghost.y}px - {squareSize / 2}px)
    );
  "
  alt=""
  draggable="false"
/>

<style>
  .ghost {
    position: absolute;
    width: 50px;
    height: 50px;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.9;
    left: 0;
    top: 0;
  }
</style>
