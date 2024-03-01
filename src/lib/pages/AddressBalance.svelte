<script lang="ts">
    import { nodeUrl } from "../Client.svelte";
    import { OutputData, Wallet } from "@iota/sdk-wasm/web";

    (BigInt.prototype as any).toJSON = function () {
        return this.toString(10);
    };

    let bech32Address = "";
    // Used to determine if the wallet should be initialized new
    let walletInitializedAddress = "";
    let balance: any;
    let wallet: Wallet;
    let unspentOutputs: OutputData[] = [];

    const initWallet = async () => {
        if (wallet == undefined || bech32Address != walletInitializedAddress) {
            walletInitializedAddress = bech32Address;
            wallet = await Wallet.create({
                address: bech32Address,
                storagePath: "./alice-database",
                clientOptions: {
                    nodes: [nodeUrl],
                },
                secretManager: "placeholder",
            });
        }
    };

    const getBalance = async () => {
        try {
            await initWallet();
            balance = await wallet.sync();
            console.log(balance);
        } catch (err) {
            alert(err);
        }
    };
    const getUnspentOutputs = async () => {
        try {
            await initWallet();

            balance = await wallet.sync();
            unspentOutputs = await wallet.unspentOutputs();
        } catch (err) {
            alert(err);
        }
    };
</script>

<main>
    <input
        type="string"
        size="64"
        bind:value={bech32Address}
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
</main>

<style>
    pre {
        text-align: left;
    }
</style>
