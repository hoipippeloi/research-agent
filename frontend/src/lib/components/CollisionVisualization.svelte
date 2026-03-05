<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as d3 from "d3";

    interface NodeDatum extends d3.SimulationNodeDatum {
        r: number;
        group: number;
    }

    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;
    let width = 800;
    let height = 800;
    let simulation: d3.Simulation<NodeDatum, undefined> | null = null;
    let nodes: NodeDatum[] = [];

    function initData() {
        const k = width / 200;
        const r = d3.randomUniform(k, k * 4);
        const n = 4;
        return Array.from({ length: 200 }, (_, i) => ({
            r: r(),
            group: i && (i % n + 1)
        }));
    }

    function initVisualization() {
        if (!container) return;

        const viewportHeight = window.innerHeight;
        const maxCanvasHeight = Math.min(viewportHeight * 0.5, 500);
        
        width = Math.min(container.clientWidth, 800);
        height = Math.min(width, maxCanvasHeight);

        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        container.appendChild(canvas);

        context = canvas.getContext("2d")!;
        const color = d3.scaleOrdinal<number, string>(d3.schemeTableau10);

        nodes = initData().map(Object.create);

        simulation = d3.forceSimulation<NodeDatum>(nodes)
            .alphaTarget(0.3)
            .velocityDecay(0.1)
            .force("x", d3.forceX<NodeDatum>().strength(0.01))
            .force("y", d3.forceY<NodeDatum>().strength(0.01))
            .force("collide", d3.forceCollide<NodeDatum>().radius(d => d.r + 1).iterations(3))
            .force("charge", d3.forceManyBody<NodeDatum>().strength((d, i) => i ? 0 : -width * 2 / 3))
            .force("bounds", () => {
                const hw = width / 2;
                const hh = height / 2;
                for (const node of nodes) {
                    if (node.x !== undefined && node.y !== undefined) {
                        node.x = Math.max(-hw + node.r, Math.min(hw - node.r, node.x));
                        node.y = Math.max(-hh + node.r, Math.min(hh - node.r, node.y));
                    }
                }
            })
            .on("tick", ticked);

        function ticked() {
            context.clearRect(0, 0, width, height);
            context.save();
            context.translate(width / 2, height / 2);
            for (let i = 1; i < nodes.length; ++i) {
                const d = nodes[i];
                const x = d.x ?? 0;
                const y = d.y ?? 0;
                context.beginPath();
                context.moveTo(x + d.r, y);
                context.arc(x, y, d.r, 0, 2 * Math.PI);
                context.fillStyle = color(d.group);
                context.fill();
            }
            context.restore();
        }

        d3.select(canvas)
            .on("touchmove", (event: Event) => event.preventDefault())
            .on("pointermove", pointermoved);

        function pointermoved(event: PointerEvent) {
            const [x, y] = d3.pointer(event);
            nodes[0].fx = x - width / 2;
            nodes[0].fy = y - height / 2;
        }
    }

    function handleResize() {
        if (container && canvas && simulation) {
            const viewportHeight = window.innerHeight;
            const maxCanvasHeight = Math.min(viewportHeight * 0.5, 500);
            
            width = Math.min(container.clientWidth, 800);
            height = Math.min(width, maxCanvasHeight);
            canvas.width = width;
            canvas.height = height;
            simulation.force<d3.ForceManyBody<NodeDatum>>("charge")?.strength((d, i) => i ? 0 : -width * 2 / 3);
            simulation.alpha(0.3).restart();
        }
    }

    onMount(() => {
        initVisualization();
        window.addEventListener("resize", handleResize);
    });

    onDestroy(() => {
        window.removeEventListener("resize", handleResize);
        if (simulation) {
            simulation.stop();
        }
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    });
</script>

<div bind:this={container} class="collision-container w-full"></div>

<style>
    .collision-container {
        background: #fff;
        border-radius: 1.5rem;
        overflow: hidden;
        max-height: 50vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
