<script lang="ts">
    import { getClient, nodeUrl } from "../Client.svelte";
    import { OutputData, Wallet } from "@iota/sdk-wasm/web";

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
            balance = await wallet.sync();
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

            await wallet.sync();
            unspentOutputs = await wallet.unspentOutputs();
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    };
</script>

<main>
    <input
        type="string"
        size="64"
        bind:value={walletAddress}
        placeholder="bech32 address"
    />
    <br />
    <button on:click={getBalance}>get balance</button>
    <button on:click={getUnspentOutputs}>get unspent outputs</button>
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
