<script lang="ts">
  import { onMount } from "svelte";
  import { game } from "$lib/events/store";
  import { initStockfish, requestMove } from "$lib/engines/stockfish";
  import "$lib/core/engineLoop";
  import ChessBoard from "$lib/ui/ChessBoard.svelte";
  onMount(() => {
    initStockfish((move) => {
      console.log("Stockfish move:", move);
    });
  });
</script>

<main>
  <h1>Eight Squared</h1>

  <pre>{$game.fen}</pre>
  <ChessBoard />
</main>
