<script lang="ts">
  import { game } from "$lib/events/store";
  import { Chess } from "chess.js";
  import { pieces } from "$lib/ui/pieces";
  import GhostPiece from "./GhostPiece.svelte";

  type Vec = { x: number; y: number };

  type Interaction =
    | { type: "idle" }
    | {
        type: "armed";
        square: string;
        start: Vec;
        legal: string[];
        moved: boolean;
      }
    | { type: "selected"; square: string; legal: string[] }
    | {
        type: "dragging";
        square: string;
        start: Vec;
        legal: string[];
      };

  let boardSize = $state(400);
  $effect(() => {
    if (!boardEl) return;

    const observer = new ResizeObserver(() => {
      boardSize = boardEl?.clientWidth ?? 400;
    });

    observer.observe(boardEl);
    return () => observer.disconnect();
  });

  let boardEl = $state<HTMLElement | null>(null);
  let interaction: Interaction = $state({ type: "idle" });

  let snapTarget = $state<string | null>(null);

  const DRAG_THRESHOLD = 6;
  const squareSize = $derived(boardSize / 8);

  function chess() {
    return new Chess($game.fen);
  }

  function computeLegalMoves(from: string) {
    return chess()
      .moves({ square: from as any, verbose: true })
      .map((m) => m.to);
  }

  function attemptMove(from: string, to: string) {
    const c = chess();

    const move = c.move({
      from,
      to,
      promotion: "q",
    });

    if (!move) return false;

    game.dispatch({
      type: "MOVE",
      from,
      to,
      promotion: move.promotion,
      source: "user",
    });

    return true;
  }
  const legalAt = (sq: string) =>
    interaction.type !== "idle" && interaction.legal.includes(sq);
  const selectedAt = (sq: string) =>
    interaction.type !== "idle" && interaction.square === sq;

  function squareToXY(square: string): Vec {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);

    return {
      x: file * squareSize + squareSize / 2,
      y: rank * squareSize + squareSize / 2,
    };
  }

  function onPointerDown(square: string, e: PointerEvent) {
    const c = chess();
    const piece = c.get(square as any);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (interaction.type === "idle") {
      if (!piece || piece.color !== c.turn()) return;
      interaction = {
        type: "armed",
        square,
        start: { x: e.clientX, y: e.clientY },
        legal: computeLegalMoves(square),
        moved: false,
      };

      return;
    }

    if (interaction.type === "selected") {
      // click valid target
      if (interaction.legal.includes(square)) {
        attemptMove(interaction.square, square);
      }
      // clicked on a non-legal square or another player's piece
      if (!piece || piece.color !== c.turn()) {
        end();
        return;
      }
      // if we clicked on another of our pieces then stay as "selected"
      // but change the selection
      interaction = {
        type: "armed",
        square,
        start: { x: e.clientX, y: e.clientY },
        legal: computeLegalMoves(square),
        moved: false,
      };

      return;
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (interaction.type !== "armed") return;

    const dx = e.clientX - interaction.start.x;
    const dy = e.clientY - interaction.start.y;

    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      interaction = {
        type: "dragging",
        square: interaction.square,
        start: interaction.start,
        legal: interaction.legal,
      };
    }
  }

  function end() {
    interaction = { type: "idle" };
    snapTarget = null;
  }

  function onPointerUp(square: string) {
    if (interaction.type === "idle") return;

    // ---------------- DRAG ----------------
    if (interaction.type === "dragging") {
      const dest = snapTarget ?? square;

      if (interaction.legal.includes(dest)) {
        attemptMove(interaction.square, dest);
      }

      end();
      return;
    }

    // ---------------- CLICK (armed only) ----------------
    if (interaction.type === "armed") {
      // click same square = deselect
      if (interaction.square === square) {
        interaction = { type: "selected", square, legal: interaction.legal };
        return;
      }

      // click valid target
      if (interaction.legal.includes(square)) {
        attemptMove(interaction.square, square);
      }

      end();
    }
  }

  function pieceAt(square: string) {
    if (interaction.type === "dragging" && interaction.square === square) {
      return null;
    }

    return chess().get(square as any);
  }

  function getDragStartXY(i: Interaction) {
    if (i.type === "idle") return null;
    return squareToXY(i.square);
  }

  const dragStartXY = $derived(getDragStartXY(interaction));
</script>

<svelte:window on:pointermove={onPointerMove} />
<div class="board" bind:this={boardEl}>
  {#each ["8", "7", "6", "5", "4", "3", "2", "1"] as r}
    {#each ["a", "b", "c", "d", "e", "f", "g", "h"] as f}
      {@const sq = `${f}${r}`}
      {@const piece = pieceAt(sq)}

      <div
        role="none"
        class="square"
        class:dark={(f.charCodeAt(0) + +r) % 2 === 1}
        class:selected={selectedAt(sq)}
        class:legal={legalAt(sq)}
        onpointerdown={(e) => onPointerDown(sq, e)}
        onpointerup={() => onPointerUp(sq)}
      >
        {#if piece}
          {@const key = piece.color + piece.type}
          <img class="piece" src={pieces[key]} alt={key} />
        {/if}
      </div>
    {/each}
  {/each}
  {#if interaction.type === "dragging" && boardEl && dragStartXY}
    {@const piece = chess().get(interaction.square as any)}

    {#if piece}
      <GhostPiece
        {boardEl}
        legalMoves={interaction.legal}
        {piece}
        {dragStartXY}
        {squareSize}
        bind:snapTarget
      />
    {/if}
  {/if}
</div>

<style>
  .board {
    width: min(100vw, 800px);
    aspect-ratio: 1;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    position: relative;
    border: 1px solid #333;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .square {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .square.dark {
    background: #769656;
  }
  .square:not(.dark) {
    background: #eeeed2;
  }

  .square.selected {
    outline: 2px solid yellow;
  }

  .square.legal::after {
    content: "";
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.35);
    position: absolute;
  }

  .piece {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
