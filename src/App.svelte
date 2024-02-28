<script lang="ts">
  import Client from "./lib/Client.svelte";
  import Indexer from "./lib/Indexer.svelte";
  import UtxoChanges from "./lib/UtxoChanges.svelte";
  import TabSelector, { selectedTab } from "./lib/TabSelector.svelte";
</script>

<main>
  <div style="display: grid; grid-template-columns: 1fr 1fr 3fr;">
    <div>
      <TabSelector />
    </div>
    <div>
      <Client />
    </div>
  </div>
  <br />

  {#if $selectedTab == "indexer"}
    <Indexer />
  {:else}
    <UtxoChanges />
  {/if}
</main>
