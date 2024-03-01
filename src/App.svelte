<script>
  import AddressBalance from "./lib/pages/AddressBalance.svelte";
  import AddressConverter from "./lib/pages/AddressConverter.svelte";
  import AddressGeneration from "./lib/pages/AddressGeneration.svelte";
  import Indexer from "./lib/pages/Indexer.svelte";
  import UtxoChanges from "./lib/pages/UtxoChanges.svelte";
  import Client from "./lib/Client.svelte";
  import Tabs from "./lib/Tabs.svelte";

  // List of tab items with labels, values and assigned components
  let items = [
    { label: "address converter", component: AddressConverter },
    { label: "inx-indexer", component: Indexer },
    { label: "UTXO changes", component: UtxoChanges },
    { label: "address generation", component: AddressGeneration },
    { label: "address balance", component: AddressBalance },
  ].map((e, index) => {
    // @ts-ignore
    e.value = index;
    return e;
  });
</script>

<Client />
<Tabs {items} />
