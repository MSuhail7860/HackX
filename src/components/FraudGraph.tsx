
import React, { useState, useRef, useEffect } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { generateFraudNetwork, GraphData, Node } from '../data/mockGraphData';
import { X, AlertTriangle, ShieldCheck, Skull } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming shadcn/ui or simple utility exists

const FraudGraph: React.FC = () => {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        // Initialize Data
        setData(generateFraudNetwork(100));

        // Resize Handler
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const getNodeColor = (node: Node) => {
        switch (node.type) {
            case 'high-risk':
                return '#ef4444'; // Red-500
            case 'mule':
                return '#f97316'; // Orange-500
            case 'clean':
                return '#22c55e'; // Green-500
            default:
                return '#9ca3af';
        }
    };

    const handleNodeClick = (node: Node) => {
        setSelectedNode(node);

        // Zoom to node
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(4, 2000);
        }
    };

    return (
        <div className="relative w-full h-full bg-slate-950 overflow-hidden" ref={containerRef}>
            {/* Graph Container */}
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                nodeColor={(node: any) => getNodeColor(node)}
                nodeVal="val"
                linkColor={() => '#475569'} // Slate-600
                linkWidth={1}
                enableNodeDrag={false}
                onNodeClick={(node) => handleNodeClick(node as Node)}
                backgroundColor="#020617" // Slate-950
            />

            {/* Side Panel / Overlay */}
            {selectedNode && (
                <div className="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-6 text-slate-100 transition-all duration-300 animate-in slide-in-from-right-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {selectedNode.type === 'high-risk' && <Skull className="w-5 h-5 text-red-500" />}
                                {selectedNode.type === 'mule' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                                {selectedNode.type === 'clean' && <ShieldCheck className="w-5 h-5 text-green-500" />}
                                Account Details
                            </h2>
                            <p className="text-xs text-slate-400 font-mono mt-1">{selectedNode.id}</p>
                        </div>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Risk Status</span>
                            <div className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-20",
                                selectedNode.type === 'high-risk' ? "bg-red-500 text-red-500" :
                                    selectedNode.type === 'mule' ? "bg-orange-500 text-orange-500" :
                                        "bg-green-500 text-green-500"
                            )}>
                                {selectedNode.type.toUpperCase()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Betweenness</span>
                                <span className="text-xl font-mono font-bold text-blue-400">
                                    {selectedNode.centrality.toFixed(4)}
                                </span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Connections</span>
                                <span className="text-xl font-mono font-bold text-purple-400">
                                    {/* Mock Degree Count */}
                                    {Math.floor(selectedNode.val * 1.5)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
                                View Transaction History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur px-4 py-3 rounded-lg border border-slate-700 text-xs text-slate-300">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span> Mule Account
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span> Clean Account
                </div>
            </div>
        </div>
    );
};

export default FraudGraph;
