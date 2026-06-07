<script lang="ts">
  import { pieces } from "$lib/ui/pieces";

  type Piece = {
    color: "w" | "b";
    type: string;
  };

  type Vec = { x: number; y: number };

  type Props = {
    boardEl: HTMLElement;
    legalMoves: string[];
    piece: Piece;
    squareSize: number;
    dragStartXY: Vec;
    snapTarget?: string | null;
  };

  let {
    boardEl,
    legalMoves,
    piece,
    squareSize,
    dragStartXY,
    snapTarget = $bindable<string | null>(null),
  }: Props = $props();

  let rect = $state<DOMRect | null>(null);

  let pointer = $state<Vec>({ x: 0, y: 0 });
  let ghost = $state<Vec | null>(null);

  let hasInitialised = $state(false);

  $effect(() => {
    if (!dragStartXY) return;

    ghost = { ...dragStartXY };
    pointer = { ...dragStartXY };
    hasInitialised = true;
  });

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
      square: best,
      pos: squareToXY(best),
      distance: bestD,
    };
  }

  function onPointerMove(e: PointerEvent) {
    if (!rect || !hasInitialised) return;

    const p = clientToBoard(e);
    if (!p) return;

    pointer = p;
  }

  function tick() {
    if (ghost) {
      const snap = nearestSnap();

      const target =
        snap && snap.distance < squareSize * 0.55 ? snap.pos : pointer;

      if (snap && snap.distance < squareSize * 0.55) {
        snapTarget = snap.square;
      } else {
        snapTarget = null;
      }

      ghost = {
        x: ghost.x + (target.x - ghost.x) * 0.85,
        y: ghost.y + (target.y - ghost.y) * 0.85,
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

{#if hasInitialised && ghost}
  <img
    class="ghost"
    src={sprite}
    style="
      transform: translate({ghost.x - squareSize / 2}px, {ghost.y -
      squareSize / 2}px);
      width: {squareSize}px;
      height: {squareSize}px;
    "
    alt=""
    draggable="false"
  />
{/if}

<style>
  .ghost {
    position: absolute;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.9;
    left: 0;
    top: 0;
  }
</style>
