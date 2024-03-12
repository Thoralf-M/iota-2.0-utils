<script lang="ts">
    import {
        Utils,
        AddressType,
        Ed25519Address,
        AccountAddress,
        NftAddress,
        AnchorAddress,
        Address,
        ImplicitAccountCreationAddress,
    } from "@iota/sdk-wasm/web";

    let publicKeyOrOutputId = "";
    let pubKeyHashOrId = "";
    let bech32Address = "";
    let addressType = AddressType.Ed25519;
    let bech32HRP = "rms";
    let error = "";

    const convertPubKeyHashOrId = () => {
        error = "";
        try {
            let addressToConvert: Address;
            switch (addressType) {
                case AddressType.Ed25519:
                    addressToConvert = new Ed25519Address(pubKeyHashOrId);
                    break;
                case AddressType.Account:
                    addressToConvert = new AccountAddress(pubKeyHashOrId);
                    break;
                case AddressType.Nft:
                    addressToConvert = new NftAddress(pubKeyHashOrId);
                    break;
                case AddressType.Anchor:
                    addressToConvert = new AnchorAddress(pubKeyHashOrId);
                    break;
                case AddressType.ImplicitAccountCreation:
                    addressToConvert = new ImplicitAccountCreationAddress(
                        pubKeyHashOrId,
                    );
                    break;
            }
            // @ts-ignore
            bech32Address = Utils.addressToBech32(addressToConvert, bech32HRP);
        } catch (err: any) {
            error = JSON.stringify(JSON.parse(err.message).payload.error);
        }
    };
    const convertBech32Address = () => {
        error = "";
        try {
            let parsedAddress = Utils.parseBech32Address(bech32Address);
            pubKeyHashOrId = parsedAddress.toString();
            addressType = parsedAddress.type;
        } catch (err: any) {
            error = JSON.stringify(JSON.parse(err.message).payload.error);
        }
    };
    const blake2b256Hash = () => {
        error = "";
        try {
            // Called `computeAccountId()` but works the same for output IDs
            let hash = Utils.computeAccountId(publicKeyOrOutputId);
            pubKeyHashOrId = hash;
            convertPubKeyHashOrId();
        } catch (err: any) {
            error = JSON.stringify(JSON.parse(err.message).payload.error);
        }
    };
</script>

<main>
    Public key/ output ID:
    <input
        type="string"
        size="64"
        bind:value={publicKeyOrOutputId}
        on:input={() => blake2b256Hash()}
        placeholder="public key or output ID to hash with blake2b256"
    />
    <br />
    Address type:
    <select
        bind:value={addressType}
        on:input={() =>
            // Without the small timeout it will convert the address with the previous type
            setTimeout(() => {
                convertPubKeyHashOrId();
            }, 1)}
    >
        {#each Object.keys(AddressType)
            .filter((addressName) => {
                if (isNaN(Number(addressName)) && addressName != "Multi" && addressName != "Restricted") {
                    return addressName;
                }
            })
            .map((addressType) => {
                // @ts-ignore
                return { addressType, typeByte: AddressType[addressType] };
            }) as filter}
            <option value={filter.typeByte}
                >{filter.typeByte + " " + filter.addressType}</option
            >
        {/each}
    </select>
    PubKeyHash/ID:
    <input
        type="string"
        size="64"
        bind:value={pubKeyHashOrId}
        on:input={() => convertPubKeyHashOrId()}
        placeholder="public key or account/nft/anchor ID"
    />
    <br />
    Bech32 HRP:
    <input
        type="string"
        size="15"
        bind:value={bech32HRP}
        on:input={() => convertPubKeyHashOrId()}
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

    Bech32 Address:
    <input
        type="string"
        size="64"
        bind:value={bech32Address}
        on:input={() => convertBech32Address()}
        placeholder="bech32 address"
    />

    <br />
    {error}
</main>
