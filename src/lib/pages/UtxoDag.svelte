<script lang="ts">
    import { getClient } from "../Client.svelte";
    import { Client, OutputType, Utils } from "@iota/sdk-wasm/web";
    import * as Viva from "vivagraphjs";

    let round = 0;
    let relatedOutputsRequests = 3;
    let startingOutputId = "";
    let knownOutputIds = new Set();
    let knownTransactionIds = new Set();
    let utxos: any = {};

    let selectedNode = "";
    let selectedNodeData = {};

    let renderer: any;
    let graph: any;
    let graphics: any;

    const getRandomOutputId = async () => {
        try {
            let client = await getClient();
            let outputIds = (await client.outputIds({ cursor: "" })).items;
            startingOutputId =
                outputIds[Math.floor(Math.random() * outputIds.length)];
        } catch (err) {
            alert(err);
        }
    };

    const getOutput = async (outputId: string) => {
        try {
            initGraph();

            if (knownOutputIds.has(outputId)) {
                return;
            }
            let client = await getClient();
            let output = await client.getOutputWithMetadata(outputId);

            utxos[outputId] = output;
            knownOutputIds.add(outputId);

            graph.addNode(outputId);
            // Get it again to set color, haven't found a way to set it when adding the node
            var nodeUI = graphics.getNodeUI(outputId);

            nodeUI.color = getOutputColor(output.output.type);
            nodeUI.size = output.metadata.spent ? 10 : 15;
        } catch (err) {
            alert(err);
        }
    };

    const getMoreOutputs = async (client: Client, transactionId: string) => {
        try {
            knownTransactionIds.add(transactionId);
            let block = await client.getIncludedBlock(transactionId);

            let outputIds = [];
            for (const [index, output] of block
                .asBasic()
                .payload.transaction.outputs.entries()) {
                try {
                    let outputId = Utils.computeOutputId(transactionId, index);
                    await getOutput(outputId);
                    outputIds.push(outputId);
                } catch (err) {
                    console.log(err);
                }
            }

            for (let outputId of outputIds) {
                for (let outputIdInner of outputIds) {
                    if (outputId != outputIdInner) {
                        graph.addLink(outputId, outputIdInner);
                    }
                }
            }

            for (let input of block.asBasic().payload.transaction.inputs) {
                let inputOutputId = Utils.computeOutputId(
                    input.transactionId,
                    input.transactionOutputIndex,
                );
                try {
                    await getOutput(inputOutputId);
                    for (let outputId of outputIds) {
                        graph.addLink(outputId, inputOutputId);
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        } catch (err) {
            console.log(err);
        }
    };

    const getRelatedOutputs = async () => {
        for (let i = 0; i < relatedOutputsRequests; i++) {
            round = i;
            await getRelatedOutputsInner();
        }
    };
    const getRelatedOutputsInner = async () => {
        let client = await getClient();
        for (let outputWithMetadata of Object.values(utxos)) {
            try {
                let transactionId = Utils.transactionIdFromOutputId(
                    outputWithMetadata.metadata.outputId,
                );
                if (!knownTransactionIds.has(transactionId)) {
                    await getMoreOutputs(client, transactionId);
                }

                if (!outputWithMetadata.metadata.spent) {
                    continue;
                }
                transactionId = outputWithMetadata.metadata.spent.transactionId;

                if (!knownTransactionIds.has(transactionId)) {
                    await getMoreOutputs(client, transactionId);
                }
            } catch (err) {
                console.log(err);
            }
        }
    };

    function getOutputColor(outputType: OutputType) {
        switch (outputType) {
            case OutputType.Basic:
                return 0xff5733ff;
            case OutputType.Account:
                return 0x6aa84fff;
            case OutputType.Anchor:
                return 0xff0087ff;
            case OutputType.Foundry:
                return 0xffef00ff;
            case OutputType.Nft:
                return 0x6b0103ff;
            case OutputType.Delegation:
                return 0x8400ffff;
            default:
                return 0x009ee8ff;
        }
    }

    let initialized = false;
    let initGraph = () => {
        if (initialized) {
            return;
        }
        initialized = true;
        let container = document.getElementById("graph");
        graph = Viva.Graph.graph();

        let layout = Viva.Graph.Layout.forceDirected(graph, {
            springLength: 100,
            springCoeff: 0.0005,
            dragCoeff: 0.02,
            gravity: -3,
            // timeStep: 3,
        });

        graphics = Viva.Graph.View.webglGraphics();

        renderer = Viva.Graph.View.renderer(graph, {
            layout: layout,
            graphics: graphics,
            container: container,
        });

        var events = Viva.Graph.webglInputEvents(graphics, graph);

        events
            .mouseEnter(function (node) {
                var nodeUI = graphics.getNodeUI(node.id);
                nodeUI.color = 0xffa500ff;
                nodeUI.size = 20;

                selectedNode = node.id;
                let simplified = utxos[node.id];
                delete simplified.outputIdProof;
                selectedNodeData = simplified;
            })
            .mouseLeave(function (node) {
                var nodeUI = graphics.getNodeUI(node.id);
                nodeUI.color = getOutputColor(utxos[node.id].output.type);
                nodeUI.size = utxos[node.id].metadata.spent ? 10 : 15;
            });
        // .dblClick(function (node) {
        //     console.log("Double click on node: " + node.id);
        // })
        // .click(function (node) {
        //     console.log("Single click on node: " + node.id);
        // });

        renderer.run();
    };
    let running = true;
    function toggleSimulation() {
        running ? renderer.pause() : renderer.resume();
        running = !running;
    }
    // potential improvements using https://github.com/anvaka/VivaGraphJS/issues/12#issuecomment-9130560
</script>

<main>
    <button on:click={toggleSimulation} class={running ? "active" : ""}>
        {#if !running}
            simulation off
        {:else}
            simulation on
        {/if}
    </button>
    <button on:click={() => getRandomOutputId()}>random output id</button>
    <button on:click={() => getOutput(startingOutputId)}>get output</button>
    <input
        type="string"
        size="71"
        bind:value={startingOutputId}
        placeholder="output id"
    />
    <button on:click={() => getRelatedOutputs()}>get related outputs</button>
    Distance:
    <input size="2" bind:value={relatedOutputsRequests} placeholder="rounds" />
    Progress: {round}

    <div id="graph" style="background-color: black;"></div>
    <div id="selectedOutput">{selectedNode}</div>

    <div id="legend" style="text-align: left;">
        Unspent outputs are displayed larger. Output colors:
        {#each Object.keys(OutputType)
            .filter((outputName) => {
                if (isNaN(Number(outputName))) {
                    return outputName;
                }
            })
            .map((outputType) => {
                // @ts-ignore
                return { outputType, typeByte: OutputType[outputType] };
            }) as filter}
            <div class="type-color">
                {filter.outputType}:
                <div
                    class="color-box"
                    style="background-color: #{getOutputColor(filter.typeByte)
                        .toString(16)
                        .padStart(6, '0')};"
                ></div>
            </div>
        {/each}
    </div>

    <pre style="text-align: left; display: flex;">
            {JSON.stringify(selectedNodeData, null, 1).trim()}
   </pre>
</main>

<style type="text/css">
    #graph {
        height: 100%;
        width: 100%;
        min-height: 50rem;
        position: relative;
    }
    #selectedOutput {
        position: relative;
        top: -50rem;
    }

    button {
        margin: 0.1rem;
    }

    button.active {
        color: #495057;
        background-color: #fff;
        border-color: #dee2e6 #dee2e6 #fff;
    }

    #legend {
        display: flex;
    }

    .type-color {
        display: flex;
        margin-left: 5px;
    }

    .color-box {
        width: 15px;
        height: 15px;
        margin-top: 5px;
        margin-left: 5px;
    }
</style>
