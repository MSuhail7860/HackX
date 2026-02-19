import React, { useEffect, useRef, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { AccountNode, Transaction } from '../types/index';

interface GraphViewProps {
    nodes: AccountNode[];
    links: Transaction[];
    onNodeClick: (node: AccountNode) => void;
    focusedRingId: string | null;
    timeWindow: [number, number] | null;
}

export const GraphView: React.FC<GraphViewProps> = ({ nodes, links, onNodeClick, focusedRingId, timeWindow }) => {
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });

    const graphData = useMemo(() => {
        let filteredLinks = links;
        if (timeWindow) {
            filteredLinks = links.filter(l => {
                const t = new Date(l.timestamp).getTime();
                return t >= timeWindow[0] && t <= timeWindow[1];
            });
        }

        const gLinks = filteredLinks.map(l => ({
            source: l.sender_id,
            target: l.receiver_id,
            amount: l.amount,
        }));

        // Professional Cyber-Forensics Palette
        const gNodes = nodes.map(n => {
            let color = '#0afc5d'; // Default Neon Green (Clear)
            let size = 4;

            if (n.risk_score > 80) {
                color = '#ff003c'; // Neon Red (Critical)
                size = 8;
            } else if (n.risk_score > 50) {
                color = '#fcee0a'; // Neon Yellow (Warning)
                size = 6;
            }

            return {
                ...n,
                val: size,
                color: color
            };
        });

        return { nodes: gNodes, links: gLinks };
    }, [nodes, links, timeWindow]);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (focusedRingId && graphRef.current) {
            graphRef.current.zoomToFit(1000, 100, (node: any) => node.ring_ids && node.ring_ids.includes(focusedRingId));
        } else if (graphRef.current) {
            graphRef.current.zoomToFit(1000, 50);
        }
    }, [focusedRingId, nodes]);

    return (
        <div ref={containerRef} className="w-full h-full bg-[#020617] relative overflow-hidden">
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}

                // Custom Node Rendering (Removes the "Plain Ball" look)
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px JetBrains Mono, monospace`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                    // Draw Glow Effect
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = node.color;

                    // Draw Node Circle
                    ctx.fillStyle = node.color;
                    if (focusedRingId && (!node.ring_ids || !node.ring_ids.includes(focusedRingId))) {
                        ctx.fillStyle = 'rgba(26, 26, 26, 0.2)'; // Faded for non-focus
                        ctx.shadowBlur = 0;
                    }

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                    ctx.fill();

                    // Only show ID label when zoomed in
                    if (globalScale > 1.5) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(label, node.x, node.y + node.val + 5);
                    }
                }}

                // Link Styling
                linkColor={() => 'rgba(56, 189, 248, 0.2)'}
                linkWidth={link => (link as any).amount > 10000 ? 1.5 : 0.5}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={1}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => '#38bdf8'}

                // Interaction & Physics
                onNodeClick={(node) => onNodeClick(node as unknown as AccountNode)}
                d3VelocityDecay={0.3}
                warmupTicks={100}
                cooldownTicks={100}
            />

            {/* Dashboard Legend Overlay */}
            <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md p-5 rounded-lg border border-white/10 text-xs shadow-2xl">
                <div className="flex flex-col gap-4">
                    <div>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] mb-3 uppercase">Threat Matrix</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#ff003c] shadow-[0_0_10px_#ff003c]"></div>
                                <span className="text-white/80 font-mono">Critical (Score 80+)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#fcee0a] shadow-[0_0_10px_#fcee0a]"></div>
                                <span className="text-white/80 font-mono">Warning (Score 50+)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#0afc5d] shadow-[0_0_10px_#0afc5d]"></div>
                                <span className="text-white/80 font-mono">Whitelisted / Clear</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
