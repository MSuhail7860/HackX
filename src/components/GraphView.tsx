
import React, { useEffect, useRef, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';
import { AccountNode, Transaction } from '../types';

interface GraphViewProps {
    nodes: AccountNode[];
    links: Transaction[];
    onNodeClick: (node: AccountNode) => void;
    focusedRingId: string | null;
}

export const GraphView: React.FC<GraphViewProps> = ({ nodes, links, onNodeClick, focusedRingId }) => {
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });

    // Preparing Graph Data
    // We memoize this to prevent re-parsing on every render
    const graphData = useMemo(() => {
        // Map links to simpler objects if needed, or pass directly
        // React-Force-Graph manipulates inputs, so we clone
        const gLinks = links.map(l => ({
            source: l.sender_id,
            target: l.receiver_id,
            amount: l.amount,
            // Custom ID for link stability?
        }));

        const gNodes = nodes.map(n => ({
            ...n,
            // Styling Attributes
            val: n.risk_score > 50 ? 20 : (n.risk_score > 20 ? 10 : 5),
            color: n.risk_score > 80 ? '#ef4444' : (n.risk_score > 50 ? '#f97316' : '#22c55e')
        }));

        return { nodes: gNodes, links: gLinks };
    }, [nodes, links]);

    // Resize Observer to handle container sizing
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


    // Focus on Ring
    useEffect(() => {
        if (focusedRingId && graphRef.current) {
            const ringNodes = nodes.filter(n => n.ring_ids.includes(focusedRingId));

            if (ringNodes.length > 0) {
                // We can fit graph to these nodes
                // We need their specific coordinates which are in graphData.nodes *after* simulation runs
                // But we can't easily access them from here without finding them in the internal graph state.
                // ForceGraphMethods provides .zoomToFit(duration, padding, nodeFilter)

                // Fit to selected nodes
                graphRef.current.zoomToFit(1000, 100, (node: any) => node.ring_ids && node.ring_ids.includes(focusedRingId));
            }
        } else if (graphRef.current) {
            graphRef.current.zoomToFit(1000, 50);
        }
    }, [focusedRingId, nodes]);

    return (
        <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden">
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}

                // Node Styling
                nodeLabel={(node: any) => `ID: ${node.id} \nRisk: ${node.risk_score.toFixed(0)}`}
                nodeColor={(node: any) => {
                    // Highlight logic
                    if (focusedRingId && node.ring_ids && node.ring_ids.includes(focusedRingId)) {
                        return '#ffffff'; // Spotlight
                    }
                    if (focusedRingId) return '#333333'; // Dim others
                    return node.color;
                }}
                nodeVal="val"
                nodeRelSize={4}

                // Link Styling
                linkColor={() => focusedRingId ? '#333333' : '#334155'}
                linkWidth={link => (link as any).amount > 10000 ? 2 : 1}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={2}

                // Interaction
                onNodeClick={(node) => onNodeClick(node as unknown as AccountNode)}

                // Physics
                d3VelocityDecay={0.4}
                cooldownTicks={100}
                onEngineStop={() => graphRef.current?.zoomToFit(400)}

                // Style
                backgroundColor="#050505"
            />

            {/* Legend / Overlay */}
            <div className="absolute top-4 right-4 bg-gray-900/80 p-3 rounded-lg border border-gray-800 text-xs text-gray-400 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> High Risk
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Med Risk
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Low Risk
                </div>
            </div>
        </div>
    );
};
