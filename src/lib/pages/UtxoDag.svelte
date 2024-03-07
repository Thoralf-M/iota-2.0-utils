<script lang="ts">
    import { getClient } from "../Client.svelte";
    import { OutputType, Utils } from "@iota/sdk-wasm/web";
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
        } catch (err) {
            alert(err);
        }
    };

    // TODO: cleanup and fix, still doesn't fetch all cases
    const getMoreOutputs = async (
        client,
        outputWithMetadata,
        transactionId: string,
    ) => {
        try {
            knownTransactionIds.add(transactionId);
            let block = await client.getIncludedBlock(transactionId);

            let outputIds = [];
            block
                .asBasic()
                .payload.transaction.outputs.forEach(async (output, index) => {
                    try {
                        let outputId = Utils.computeOutputId(
                            transactionId,
                            index,
                        );
                        await getOutput(outputId);
                        outputIds.push(outputId);
                        graph.addLink(
                            outputId,
                            outputWithMetadata.metadata.outputId,
                            {},
                        );
                    } catch (err) {
                        console.log(err);
                    }
                });

            for (let input of block.asBasic().payload.transaction.inputs) {
                let inputOutputId = Utils.computeOutputId(
                    input.transactionId,
                    input.transactionOutputIndex,
                );
                try {
                    await getOutput(inputOutputId);
                    for (let outputId of outputIds) {
                        graph.addLink(outputId, inputOutputId, {});
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
            // TODO: doesn't really seem to await, that's why the timeout below
            await getRelatedOutputsInner();
            await new Promise((resolve) => setTimeout(resolve, 200));
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
                    await getMoreOutputs(
                        client,
                        outputWithMetadata,
                        transactionId,
                    );
                }

                if (!outputWithMetadata.metadata.spent) {
                    continue;
                }
                transactionId = outputWithMetadata.metadata.spent.transactionId;

                if (!knownTransactionIds.has(transactionId)) {
                    await getMoreOutputs(
                        client,
                        outputWithMetadata,
                        transactionId,
                    );
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
                nodeUI.size = 10;
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
    <button on:click={() => getOutput(startingOutputId)}>get output</button>
    <input
        type="string"
        size="75"
        bind:value={startingOutputId}
        placeholder="output id"
    />
    <button on:click={() => getRelatedOutputs()}>get related outputs</button>
    Amount of requests:
    <input size="2" bind:value={relatedOutputsRequests} placeholder="rounds" />
    Round: {round}

    <div id="graph" style="background-color: black;"></div>
    <div id="selected">{selectedNode}</div>
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
    #selected {
        position: relative;
        top: -50rem;
    }

    button {
        margin: 1rem;
    }

    button.active {
        color: #495057;
        background-color: #fff;
        border-color: #dee2e6 #dee2e6 #fff;
    }
</style>
