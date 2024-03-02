<script lang="ts">
    // @ts-nocheck
    import { getClient } from "../Client.svelte";

    let pageSize = 10;

    let outputIds: string[] = [];
    let requestingData = false;
    let output: any;
    let selectedOutputType = "outputs";
    let usedQueryParameters = "";
    let explorerUrl = "";

    let additionalQueryParameters = {
        hasNativeToken: "undefined",
        hasTimelock: "undefined",
        hasStorageDepositReturn: "undefined",
        hasExpiration: "undefined",
    };

    let additionalQueryParametersWithField = {
        unlockableByAddress: "",
        address: "",
        tag: "",
        timelockedBefore: "",
        timelockedAfter: "",
        createdBefore: "",
        createdAfter: "",
    };

    const getOutputIds = async () => {
        try {
            // Limit to single page request with the empty cursor
            let queryParameters = { cursor: "", pageSize };
            requestingData = true;
            outputIds = [];
            output = undefined;
            let client = await getClient();
            let response;
            Object.entries(additionalQueryParameters)
                .filter(([key, value]) => value != "undefined")
                .map(([key, value]) => {
                    queryParameters[key] = value === "true";
                });

            Object.entries(additionalQueryParametersWithField)
                .filter(([key, value]) => value != "")
                .map(([key, value]) => {
                    if (value != "") {
                        // Parse integer values
                        if (
                            key.startsWith("time") ||
                            key.startsWith("created")
                        ) {
                            queryParameters[key] = parseInt(value);
                        } else if (key == "tag") {
                            if (value.startsWith("0x")) {
                                queryParameters[key] = value;
                            } else {
                                queryParameters[key] = utf8ToHex(value);
                            }
                        } else {
                            queryParameters[key] = value;
                        }
                    }
                });

            usedQueryParameters = JSON.stringify(queryParameters);
            switch (selectedOutputType) {
                case "outputs":
                    response = await client.outputIds(queryParameters);
                    break;
                case "account":
                    response = await client.accountOutputIds(queryParameters);
                    break;
                case "basic":
                    response = await client.basicOutputIds(queryParameters);
                    break;
                case "foundry":
                    response = await client.foundryOutputIds(queryParameters);
                    break;
                case "nft":
                    response = await client.nftOutputIds(queryParameters);
                    break;
                case "delegation":
                    response =
                        await client.delegationOutputIds(queryParameters);
                    break;
                case "anchor":
                    response = await client.anchorOutputIds(queryParameters);
                    break;
            }

            outputIds = outputIds.concat(response!.items);
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
            let nodeInfo = await client.getNodeInfo();
            if (
                nodeInfo.info.protocolParameters[0].parameters.networkName ==
                "testnet-1"
            ) {
                explorerUrl =
                    "https://explorer.shimmer.network/testnet/transaction/";
            } else if (
                nodeInfo.info.protocolParameters[0].parameters.networkName ==
                "shimmer"
            ) {
                explorerUrl =
                    "https://explorer.shimmer.network/shimmer/transaction/";
            }
        } catch (err) {
            alert(err);
        }
    };

    const utf8ToHex = (str: string) => {
        let result = "0x";
        for (let i = 0; i < str.length; i++) {
            let hex = str.charCodeAt(i).toString(16);
            result += hex.slice(-4);
        }
        return result;
    };
</script>

<main>
    Page size: <input
        type="number"
        bind:value={pageSize}
        placeholder="page size"
    />
    <div class="outputTypeSelector">
        Output type:
        {#each ["outputs", "account", "basic", "foundry", "nft", "delegation", "anchor"] as type}
            <!-- Highlight selected type -->
            {#if type == selectedOutputType}
                <button
                    class="selected"
                    on:click={() => (selectedOutputType = type)}>{type}</button
                >
            {:else}
                <button on:click={() => (selectedOutputType = type)}
                    >{type}</button
                >
            {/if}
        {/each}
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr;">
        <div>
            {#each Object.entries(additionalQueryParametersWithField) as [key, value]}
                <br />
                {key}:
                <input
                    type="string"
                    size="60"
                    bind:value={additionalQueryParametersWithField[key]}
                />
            {/each}
            <div>
                Created in:
                <button
                    on:click={() =>
                        (additionalQueryParametersWithField["createdAfter"] =
                            Math.round(Date.now() / 1000 - 3600))}
                    >the last hour</button
                >
                <button
                    on:click={() =>
                        (additionalQueryParametersWithField["createdAfter"] =
                            Math.round(Date.now() / 1000 - 86400))}
                    >the last day</button
                >
            </div>
        </div>
        <div>
            <ul style="list-style-type:none; float: left;">
                {#each Object.entries(additionalQueryParameters) as [key, value]}
                    <li>
                        {key}
                        <select bind:value={additionalQueryParameters[key]}>
                            <option value="undefined">undefined</option>
                            <option value="false">false</option>
                            <option value="true">true</option>
                        </select>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
    <button on:click={getOutputIds}>get output ids</button>
    <br />
    Used query parameters: {usedQueryParameters}
    <br />
    {#if requestingData}
        <div style="color: red;">Requesting data...</div>
        <br />
    {/if}

    <div style="display: grid; grid-template-columns: 1fr 1fr;">
        <!-- Only show the table if there are any created outputs -->
        {#if outputIds.length > 0}
            <table>
                <tr>
                    <th>Output id</th>
                </tr>
                {#each [...outputIds].reverse() as outputId}
                    <tr>
                        <td>
                            <div style="display: list; font-family: monospace;">
                                <div>
                                    <button
                                        on:click={() => getOutput(outputId)}
                                    >
                                        {outputId}</button
                                    >
                                </div>
                            </div>
                        </td>
                    </tr>
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
        {/if}
    </div>
</main>

<style>
    .outputTypeSelector {
        display: table-row;
    }
    .selected {
        background-color: rgb(160, 160, 160);
    }
    button {
        margin: 2px;
    }
</style>
