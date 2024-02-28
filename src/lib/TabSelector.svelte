<script lang="ts" context="module">
    import { writable } from "svelte/store";
    export let selectedTab = writable("indexer");
</script>

<div class="tabSelector">
    {#each ["indexer", "utxo changes"] as tab}
        <!-- Highlight selected type -->
        {#if tab == $selectedTab}
            <button class="selected" on:click={() => selectedTab.set(tab)}
                >{tab}</button
            >
        {:else}
            <button on:click={() => selectedTab.set(tab)}>{tab}</button>
        {/if}
    {/each}
</div>

<style>
    .tabSelector {
        display: table-row;
    }
    .selected {
        background-color: rgb(160, 160, 160);
    }
    button {
        margin: 2px;
    }
</style>
