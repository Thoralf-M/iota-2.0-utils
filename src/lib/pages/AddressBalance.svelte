<script lang="ts">
    import { getClient, nodeUrl } from "../Client.svelte";
    import { OutputData, Wallet, type SyncOptions } from "@iota/sdk-wasm/web";

    (BigInt.prototype as any).toJSON = function () {
        return this.toString(10);
    };

    let walletAddress = "";
    // Used to determine if the wallet should be initialized with a new address
    let previousInitializedWalletAddress = "";
    let balance: any;
    let wallet: Wallet;
    let unspentOutputs: OutputData[] = [];
    let error = "";

    let visibleSyncOptions = false;
    let syncOptions =
        '{\r\n    "forceSyncing": false,\r\n    "syncIncomingTransactions": false,\r\n    "syncPendingTransactions": true,\r\n    "wallet": {\r\n        "basicOutputs": true,\r\n        "accountOutputs": true,\r\n        "nftOutputs": true,\r\n        "delegationOutputs": true\r\n    },\r\n    "account": {\r\n        "basicOutputs": true,\r\n        "accountOutputs": false,\r\n        "foundryOutputs": true,\r\n        "nftOutputs": false,\r\n        "delegationOutputs": false\r\n    },\r\n    "nft": {\r\n        "basicOutputs": false,\r\n        "accountOutputs": false,\r\n        "nftOutputs": false,\r\n        "delegationOutputs": false\r\n    },\r\n    "syncOnlyMostBasicOutputs": false,\r\n    "syncNativeTokenFoundries": false,\r\n    "syncImplicitAccounts": false\r\n}\r\n';

    const initWallet = async () => {
        if (
            wallet == undefined ||
            walletAddress != previousInitializedWalletAddress
        ) {
            balance = undefined;
            unspentOutputs = [];
            if (walletAddress.startsWith("0x")) {
                walletAddress = await (
                    await getClient()
                ).hexToBech32(walletAddress);
            }
            previousInitializedWalletAddress = walletAddress;
            wallet = await Wallet.create({
                address: walletAddress,
                storagePath: "./alice-database",
                clientOptions: {
                    nodes: [nodeUrl],
                },
                secretManager: "placeholder",
            });
        }
    };

    const getBalance = async () => {
        error = "";
        try {
            await initWallet();
            balance = await wallet.sync(JSON.parse(syncOptions));
            console.log(balance);
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    };
    const getUnspentOutputs = async () => {
        error = "";
        try {
            await initWallet();

            await wallet.sync(JSON.parse(syncOptions));
            unspentOutputs = await wallet.unspentOutputs();
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    };
    const clearOutput = () => {
        balance = undefined;
        unspentOutputs = [];
    };
</script>

<main>
    <input
        type="string"
        size="64"
        bind:value={walletAddress}
        placeholder="wallet address (bech32 or also hex pubKeyHash for Ed25519)"
    />
    <br />

    Show sync options:
    <input type="checkbox" bind:checked={visibleSyncOptions} />
    {#if visibleSyncOptions}
        <textarea
            cols="50"
            rows="27"
            bind:value={syncOptions}
            placeholder="sync options"
        />
    {/if}
    <button on:click={getBalance}>get balance</button>
    <button on:click={getUnspentOutputs}>get unspent outputs</button>
    <button on:click={clearOutput}>clear output</button>
    <br />
    {#if balance !== undefined}
        <pre>{JSON.stringify(balance, null, 2)}</pre>
        <br />
    {/if}
    {#if unspentOutputs.length !== 0}
        <pre>{JSON.stringify(unspentOutputs, null, 2)}</pre>
        <br />
    {/if}
    <br />
    {error}
</main>

<style>
    pre {
        text-align: left;
    }
</style>
