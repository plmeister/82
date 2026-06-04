<script lang="ts">
  import { game } from "$lib/events/store";
  import { Chess } from "chess.js";
  import { pieces } from "$lib/ui/pieces";
  import GhostPiece from "./GhostPiece.svelte";

  let boardEl = $state<HTMLElement | null>(null);

  let selected = $state<string | null>(null);
  let draggingFrom = $state<string | null>(null);
  let legalMoves = $state<string[]>([]);
  let snapTarget = $state<string | null>(null);
  const SQ = 50;

  function chess() {
    return new Chess($game.fen);
  }

  function computeLegalMoves(from: string) {
    return chess()
      .moves({ square: from as any, verbose: true })
      .map((m) => m.to);
  }

  function onPointerDown(square: string) {
    const c = chess();

    const piece = c.get(square as any);
    if (!piece || piece.color !== c.turn()) return;

    draggingFrom = square;
    selected = square;
    legalMoves = computeLegalMoves(square);
  }

  function endDrag() {
    draggingFrom = null;
    selected = null;
    legalMoves = [];
  }

  function onPointerUp(square: string) {
    if (!draggingFrom) return;
    let destination = snapTarget ?? square;

    if (!legalMoves.includes(destination)) {
      endDrag();
      return;
    }

    const c = chess();

    const move = c.move({
      from: draggingFrom,
      to: destination,
      promotion: "q",
    });

    if (!move) {
      endDrag();
      return;
    }

    game.dispatch({
      type: "MOVE",
      from: draggingFrom,
      to: destination,
      promotion: move.promotion,
      source: "user",
    });

    endDrag();
  }

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  function pieceAt(square: string) {
    if (square === draggingFrom) return null;
    return chess().get(square as any);
  }

  function isDarkSquare(f: number, r: number) {
    return (f + r) % 2 === 1;
  }

  function squareToXY(square: string) {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1]);

    return {
      x: file * SQ + SQ / 2,
      y: rank * SQ + SQ / 2,
    };
  }
  const dragStartXY = $derived(draggingFrom ? squareToXY(draggingFrom) : null);
</script>

<div class="board" bind:this={boardEl}>
  {#each ranks as r, ri}
    <div class="rank">
      {#each files as f, fi}
        {@const sq = `${f}${r}`}
        {@const piece = pieceAt(sq)}

        <div
          role="none"
          class="square"
          class:dark={isDarkSquare(fi, ri)}
          class:selected={selected === sq}
          class:legal={legalMoves.includes(sq)}
          onpointerdown={() => onPointerDown(sq)}
          onpointerup={() => onPointerUp(sq)}
        >
          {#if piece}
            {@const key = piece.color + piece.type}
            <img class="piece" src={pieces[key]} alt={key} />
          {/if}
        </div>
      {/each}
    </div>
  {/each}

  {#if draggingFrom && boardEl && dragStartXY}
    {@const piece = chess().get(draggingFrom as any)}

    {#if piece}
      <GhostPiece
        {boardEl}
        {draggingFrom}
        {legalMoves}
        {piece}
        {dragStartXY}
        squareSize={SQ}
        bind:snapTarget
      />
    {/if}
  {/if}
</div>

<style>
  .board {
    display: inline-block;
    position: relative;
    border: 1px solid #333;

    /* important: prevents flex/grid parents from stretching it */
    flex: 0 0 auto;
  }

  .rank {
    display: flex;
    flex: 0 0 auto;
  }

  .square {
    width: 50px;
    height: 50px;
    flex: 0 0 50px;

    display: flex;
    align-items: center;
    justify-content: center;

    user-select: none;
    box-sizing: border-box;
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
    width: 12px;
    height: 12px;
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
