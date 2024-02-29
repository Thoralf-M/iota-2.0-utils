<script lang="ts">
    import { getClient } from "../Client.svelte";
    import init, { Utils, UtxoChangesResponse } from "@iota/sdk-wasm/web";
    import { onMount } from "svelte";
    onMount(async () => {
        try {
            await init();
            await updateLatestSlotIndex(false);
        } catch (err) {
            alert(err);
        }
    });
    let startIndex = 0;
    let endIndex = 10;
    let utxoChanges: UtxoChangesResponse[] = [];
    let requestingData = false;
    let output: any;
    let explorerUrl = "";

    const getUtxoChanges = async () => {
        try {
            requestingData = true;
            utxoChanges = [];
            output = undefined;
            let client = await getClient();
            for (let index = startIndex; index <= endIndex; index++) {
                utxoChanges = utxoChanges.concat(
                    await client.getUtxoChangesByIndex(index),
                );
            }
            console.log(utxoChanges);
            requestingData = false;
        } catch (err) {
            requestingData = false;
            alert(err);
        }
    };

    const getOutput = async (outputId: string) => {
        try {
            let client = await getClient();
            output = await client.getOutput(outputId);
            let info = await client.getInfo();
            if (
                info.nodeInfo.protocolParameters[0].parameters.networkName ==
                "testnet-1"
            ) {
                explorerUrl =
                    "https://explorer.shimmer.network/testnet/transaction/";
            } else if (
                info.nodeInfo.protocolParameters[0].parameters.networkName ==
                "shimmer"
            ) {
                explorerUrl =
                    "https://explorer.shimmer.network/shimmer/transaction/";
            }
        } catch (err) {
            alert(err);
        }
    };

    export const updateLatestSlotIndex = async (alertOnError: boolean) => {
        try {
            let nodeInfo = await (await getClient()).getInfo();
            endIndex = nodeInfo.nodeInfo.status.latestFinalizedSlot || 0;
            if (endIndex > 8) {
                startIndex = endIndex - 9;
            }
        } catch (err) {
            if (alertOnError) {
                alert(err);
            }
        }
    };
</script>

<main>
    Slot range: <input
        type="number"
        size="10"
        bind:value={startIndex}
        placeholder="slot start index"
    />
    <input
        type="number"
        size="10"
        bind:value={endIndex}
        placeholder="slot start index"
    />
    <button on:click={() => updateLatestSlotIndex(true)}>
        range latest 10 finalized slots</button
    >
    <br />
    <button on:click={getUtxoChanges}>get utxo changes</button>
    <br />
    {#if requestingData}
        <div style="color: red;">Requesting data...</div>
        <br />
    {/if}

    <div style="display: grid; grid-template-columns: 1fr 1fr;">
        <!-- Only show the table if there are any created outputs -->
        {#if utxoChanges.length > 0 && utxoChanges.some((e) => e.createdOutputs.length > 0)}
            <table>
                <tr>
                    <th>Slot index</th>
                    <th>Created outputs</th>
                </tr>
                {#each [...utxoChanges].reverse() as slotChanges}
                    {#if slotChanges.createdOutputs.length > 0}
                        <tr>
                            <td>
                                {Utils.computeSlotIndex(
                                    slotChanges.commitmentId,
                                )}
                            </td>
                            <td>
                                <div
                                    style="display: list; font-family: monospace;"
                                >
                                    {#each slotChanges.createdOutputs as created}
                                        <div>
                                            <button
                                                on:click={() =>
                                                    getOutput(created)}
                                            >
                                                {created}</button
                                            >
                                        </div>
                                    {/each}
                                </div>
                            </td>
                        </tr>
                    {/if}
                {/each}
            </table>
            {#if output}
                <div>
                    {#if explorerUrl != ""}
                        <a
                            href={explorerUrl + output.metadata.transactionId}
                            target="_blank"
                            rel="noopener noreferrer"
                            style="float:left;"
                        >
                            View tx in explorer</a
                        >
                    {/if}
                    <pre style="text-align: left;">
                    {JSON.stringify(output, null, 2)}
                </pre>
                </div>
            {/if}
        {:else}
            No UTXO changes
        {/if}
    </div>
</main>
