<script lang="ts">
    import { Utils, SecretManager, CoinType } from "@iota/sdk-wasm/web";

    let mnemonic = "";
    let pubKeyHash = "";
    let coinType = CoinType.IOTA;
    let accountIndex = 0;
    let internal = false;
    let addressIndex = 0;
    let bech32Hrp = "rms";
    let bech32Address = "";
    let error = "";

    const generateMnemonic = () => {
        error = "";
        try {
            if (mnemonic == "") {
                mnemonic = Utils.generateMnemonic();
            }
            generateAddress();
        } catch (err: any) {
            error = JSON.stringify(JSON.parse(err.message).payload.error);
        }
    };
    const generateAddress = async () => {
        error = "";
        try {
            let secretManager = SecretManager.create({ mnemonic });
            bech32Address = (
                await secretManager.generateEd25519Addresses({
                    coinType,
                    accountIndex,
                    range: { start: addressIndex, end: addressIndex + 1 },
                    bech32Hrp,
                    options: { internal },
                })
            )[0];
            pubKeyHash = Utils.parseBech32Address(bech32Address).toString();
        } catch (err: any) {
            try {
                error = JSON.stringify(JSON.parse(err.message).payload.error);
            } catch (e: any) {
                error = err;
            }
        }
    };
    const updateBech32Hrp = () => {
        error = "";
        try {
            bech32Address = Utils.addressToBech32(
                Utils.parseBech32Address(bech32Address),
                bech32Hrp,
            );
        } catch (err: any) {
            error = JSON.stringify(JSON.parse(err.message).payload.error);
        }
    };
</script>

<main>
    <button on:click={() => generateMnemonic()}>Generate</button>
    <input
        type="string"
        size="125"
        bind:value={mnemonic}
        placeholder="24 word BIP-39 mnemonic"
    />
    <br />

    BIP 44 path:
    <input
        type="number"
        list="coinTypes"
        bind:value={coinType}
        placeholder="BIP-44 coin type"
        on:input={() => generateAddress()}
    />
    <datalist id="coinTypes">
        <option value={CoinType.IOTA}>IOTA </option>
        <option value={CoinType.Shimmer}>Shimmer </option>
        <option value="1">Testnet </option>
    </datalist>

    <input
        type="number"
        min="0"
        bind:value={accountIndex}
        placeholder="account index"
        on:input={() => generateAddress()}
    />
    <select bind:value={internal} on:input={() => generateAddress()}>
        <option value={false}>false</option>
        <option value={true}>true</option>
    </select>
    <input
        type="number"
        width="1"
        min="0"
        bind:value={addressIndex}
        placeholder="address index"
        on:input={() => generateAddress()}
    />

    Bech32 HRP:
    <input
        type="string"
        size="15"
        min="0"
        bind:value={bech32Hrp}
        on:input={() => updateBech32Hrp()}
        placeholder="rms"
        list="bech32Hrps"
    />
    <datalist id="bech32Hrps">
        <option value="iota">IOTA mainnet</option>
        <option value="atoi">IOTA testnet</option>
        <option value="smr">Shimmer</option>
        <option value="rms">Shimmer testnet</option>
        <option value="tst">Other testnets</option>
    </datalist>

    <br />
    <br />
    <div>Public key hash: {pubKeyHash}</div>
    <div>Bech32 Address: {bech32Address}</div>
    <br />
    {error}
</main>

<style>
    div {
        display: flex;
    }

    input[type="number"] {
        width: 5rem;
    }
</style>
