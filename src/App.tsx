
import React, { useState } from 'react';
import { Download, Upload as UploadIcon, RefreshCw, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { GraphView } from './components/GraphView';
import { Sidebar } from './components/Sidebar';
import { FraudRingTable } from './components/FraudRingTable';
import { AccountNode, AnalysisResult, ExportData } from './types/index';
import { mockAnalysisData } from './data/mockData';

function App() {
    const [data, setData] = useState<AnalysisResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<AccountNode | null>(null);
    const [focusedRingId, setFocusedRingId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Temporal Scrubbing State
    const [fullTimeRange, setFullTimeRange] = useState<[number, number] | null>(null);
    const [activeTimeRange, setActiveTimeRange] = useState<[number, number] | null>(null);

    const handleFileUpload = (uploadedData: AnalysisResult) => {
        setIsAnalyzing(true);
        // Simulated Deep Scan Delay (1.5s)
        setTimeout(() => {
            setData(uploadedData);
            setFocusedRingId(null);
            setSelectedNode(null);

            // Calculate Time Range
            if (uploadedData.transactions.length > 0) {
                const timestamps = uploadedData.transactions.map(t => new Date(t.timestamp).getTime());
                const min = Math.min(...timestamps);
                const max = Math.max(...timestamps);
                setFullTimeRange([min, max]);
                setActiveTimeRange([min, max]);
            }

            setIsAnalyzing(false);
        }, 1500);
    };

    const handleDownload = () => {
        if (!data) return;

        // Strict RIFT 2026 Schema Mapping
        const exportData: ExportData = {
            suspicious_accounts: data.suspicious_accounts.map(acc => ({
                account_id: acc.id,
                suspicion_score: acc.risk_score,
                detected_patterns: acc.patterns,
                ring_id: acc.ring_ids
            })),
            fraud_rings: data.fraud_rings.map(ring => ({
                ring_id: ring.ring_id,
                member_accounts: ring.member_accounts,
                pattern_type: ring.pattern_type,
                risk_score: ring.risk_score
            })),
            summary: {
                total_accounts_analyzed: data.summary.total_accounts_analyzed,
                suspicious_accounts_flagged: data.summary.suspicious_accounts_flagged,
                fraud_rings_detected: data.summary.fraud_rings_detected,
                processing_time_seconds: data.summary.processing_time_seconds,
                total_whitelisted_accounts: data.summary.total_whitelisted_accounts
            }
        };

        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(exportData, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "fraud_analysis_export.json";
        link.click();
    };

    const loadMockData = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setData(mockAnalysisData);

            // Calculate Time Range
            if (mockAnalysisData.transactions.length > 0) {
                const timestamps = mockAnalysisData.transactions.map(t => new Date(t.timestamp).getTime());
                const min = Math.min(...timestamps);
                const max = Math.max(...timestamps);
                setFullTimeRange([min, max]);
                setActiveTimeRange([min, max]);
            }

            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="h-screen flex flex-col font-sans overflow-hidden selections:bg-blue-500/30">
            {/* Header */}
            <header className="h-14 border-b border-white/5 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-6 z-50 fixed top-0 w-full">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Hack<span className="font-light text-red-500">X</span></h1>
                            <p className="text-[9px] text-gray-500 tracking-[0.2em] uppercase leading-none">Financial Crime Forensic Unit</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-2"></div>

                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-[10px] font-bold text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                        SYSTEM LIVE
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {data ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setData(null)}
                                className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-600 rounded bg-gray-900/50"
                            >
                                RESET
                            </button>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-1.5 text-xs font-bold rounded flex items-center gap-2 rift-blue-btn"
                            >
                                <Download size={14} />
                                EXPORT REPORT
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={loadMockData}
                            className="px-4 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded flex items-center gap-2 transition-all"
                        >
                            <RefreshCw size={14} />
                            LOAD DEMO
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 mt-14 p-4 overflow-hidden relative z-0">
                {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full">
                        {/* Terminal Loader */}
                        <div className="w-[400px] h-[200px] bg-slate-950/80 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-400 shadow-2xl backdrop-blur-md flex flex-col">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2 text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                <span className="ml-auto">TERM_v2.0.4</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p>&gt; INITIALIZING CORE...</p>
                                <p>&gt; PARSING GRAPH NODES...</p>
                                <p className="animate-pulse">&gt; RUNNING TEMPORAL ANALYSIS (DLS-DEPTH-5)...</p>
                                <p className="text-gray-500">... correlating timestamps</p>
                                <p className="text-gray-500">... verifying shell patterns</p>
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded mt-2 overflow-hidden">
                                <div className="h-full bg-green-500 animate-[width_1.5s_ease-in-out_forwards]" style={{ width: '90%' }}></div>
                            </div>
                        </div>
                    </div>
                ) : !data ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700 h-full">
                        <div className="text-center mb-16 max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-blue-400 mb-6 box-glow">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                NEXT-GEN FORENSICS
                            </div>
                            <h2 className="text-7xl font-black text-white mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] tracking-tighter">
                                HACK<span className="text-red-500">X</span> INTELLIGENCE
                            </h2>
                            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                                Identify <span className="text-red-400 font-medium">Laundering Rings</span>, monitor <span className="text-blue-400 font-medium">Temporal Flows</span>, and dismantle <span className="text-purple-400 font-medium">Shell Networks</span> with military-grade graph analysis.
                            </p>
                        </div>
                        <FileUpload onFileUpload={handleFileUpload} />
                    </div>
                ) : (
                    <div className="flex gap-4 h-full">

                        {/* LEFT COL: Analysis & Graph */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0">

                            {/* Row 1: Metrics (Stat Pills) */}
                            <div className="grid grid-cols-4 gap-4">
                                {/* M1: Total Txs */}
                                <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                                    <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2">
                                        <Zap size={10} className="text-blue-500" /> Total Txs
                                    </p>
                                    <h3 className="text-xl font-bold text-white text-glow mt-1">{data.summary.total_transactions.toLocaleString()}</h3>
                                </div>

                                {/* M2: Volume */}
                                <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-green-500/30">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
                                    <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2">
                                        <RefreshCw size={10} className="text-green-500" /> Volume
                                    </p>
                                    <h3 className="text-xl font-bold text-white text-glow mt-1">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(data.summary.total_volume)}
                                    </h3>
                                </div>

                                {/* M3: Risks */}
                                <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-red-500/30">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                                    <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2">
                                        <UploadIcon size={10} className="text-red-500" /> Threats
                                    </p>
                                    <div className="flex items-end gap-2 mt-1">
                                        <h3 className="text-xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">{data.summary.suspicious_accounts_flagged}</h3>
                                        <span className="text-[9px] text-red-400 font-mono mb-1. opacity-70">CRITICAL</span>
                                    </div>
                                </div>

                                {/* M4: Whitelisted */}
                                <div className="relative group overflow-hidden bg-slate-950/40 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/30">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                                    <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2">
                                        <Zap size={10} className="text-purple-500" /> Verified
                                    </p>
                                    <h3 className="text-xl font-bold text-white text-glow mt-1">{data.summary.total_whitelisted_accounts}</h3>
                                </div>
                            </div>

                            {/* Main Graph Card */}
                            <div className="flex-1 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden relative shadow-2xl group min-h-0">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/0 via-blue-600/50 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>

                                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
                                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">Network Topology</h3>
                                    <p className="text-[9px] text-gray-500">Live Visualization • DLS-Depth-5</p>
                                </div>

                                <GraphView
                                    nodes={data.suspicious_accounts}
                                    links={data.transactions}
                                    onNodeClick={setSelectedNode}
                                    focusedRingId={focusedRingId}
                                    timeWindow={activeTimeRange}
                                />

                                {/* Temporal Floating Controls */}
                                {fullTimeRange && activeTimeRange && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[500px] bg-slate-950/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl z-20">
                                        <div className="flex justify-between text-[10px] text-gray-400 font-mono uppercase mb-2">
                                            <span>{new Date(activeTimeRange[0]).toLocaleString()}</span>
                                            <span className="text-blue-400 font-bold tracking-widest">TEMPORAL_SCRUB</span>
                                            <span>{new Date(activeTimeRange[1]).toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={fullTimeRange[0]}
                                            max={fullTimeRange[1]}
                                            value={activeTimeRange[1]}
                                            onChange={(e) => setActiveTimeRange([fullTimeRange[0], Number(e.target.value)])}
                                            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COL: Sidebar Data (Bento Layout) */}
                        <div className="w-[450px] flex flex-col gap-4">

                            {/* Top Right: Pattern List / Ring Table */}
                            <div className={`flex flex-col bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl transition-all duration-300 ${selectedNode ? 'h-[250px]' : 'flex-1'}`}>
                                <FraudRingTable
                                    rings={data.fraud_rings}
                                    onRingSelect={(id) => setFocusedRingId(id === focusedRingId ? null : id)}
                                    selectedRingId={focusedRingId}
                                />
                            </div>

                            {/* Bottom Right: Selection Details (Conditional) */}
                            {selectedNode ? (
                                <div className="flex-1 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-xl min-h-0">
                                    <Sidebar
                                        node={selectedNode}
                                        onClose={() => setSelectedNode(null)}
                                    />
                                </div>
                            ) : (
                                <div className="h-[200px] bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 flex items-center justify-center text-gray-600 border-dashed">
                                    <div className="text-center">
                                        <Zap className="mx-auto mb-2 opacity-20" size={32} />
                                        <p className="text-xs uppercase tracking-widest">Select a Node</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
