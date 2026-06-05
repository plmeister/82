<script lang="ts">
  import { onMount } from "svelte";
  import { game } from "$lib/events/store";
  import "$lib/core/engineLoop";
  import ChessBoard from "$lib/ui/ChessBoard.svelte";
  import { initEngine } from "$lib/game/orchestrator";

  onMount(() => {
    initEngine();
  });
</script>

<main>
  <h1>Eight Squared</h1>

  <pre>{$game.fen}</pre>
  <ChessBoard />
</main>
