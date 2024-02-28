<script lang="ts" context="module">
    import { Client } from "@iota/sdk-wasm/web";

    let node = "https://api.testnet.shimmer.network";
    export const getClient = async () => {
        return await Client.create({
            nodes: [node],
        });
    };
</script>

<input size="50" bind:value={node} placeholder="node url" />
