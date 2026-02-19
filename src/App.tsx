
import React, { useState } from 'react';
import { Download, Upload as UploadIcon, RefreshCw, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { GraphView } from './components/GraphView';
import { Sidebar } from './components/Sidebar';
import { FraudRingTable } from './components/FraudRingTable';
import { AccountNode, AnalysisResult } from './types';
import { mockAnalysisData } from './data/mockData';

function App() {
    const [data, setData] = useState<AnalysisResult | null>(null);
    const [selectedNode, setSelectedNode] = useState<AccountNode | null>(null);
    const [focusedRingId, setFocusedRingId] = useState<string | null>(null);

    const handleFileUpload = (uploadedData: AnalysisResult) => {
        setData(uploadedData);
        setFocusedRingId(null);
        setSelectedNode(null);
    };

    const handleDownload = () => {
        if (!data) return;
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "fraud_analysis_export.json";
        link.click();
    };

    const loadMockData = () => {
        setData(mockAnalysisData);
    };

    return (
        <div className="h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/40">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">HACK <span className="font-light text-red-500">X</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    {data ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setData(null)}
                                className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors border border-gray-700 rounded hover:bg-gray-800"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 flex items-center gap-2 transition-all"
                            >
                                <Download size={14} />
                                Export JSON
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={loadMockData}
                            className="px-4 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded flex items-center gap-2 transition-all"
                        >
                            <RefreshCw size={14} />
                            Load Demo Data
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative flex overflow-hidden">
                {!data ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
                        <div className="text-center mb-12 max-w-2xl">
                            <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 mb-6 drop-shadow-sm">
                                Financial Crime Detection
                            </h2>
                            <p className="text-xl text-gray-400 font-light">
                                Advanced graph algorithms for identifying <span className="text-red-400">Cycles</span>, <span className="text-orange-400">Smurfing</span>, and <span className="text-purple-400">Layering</span> networks.
                            </p>
                        </div>

                        <FileUpload onFileUpload={handleFileUpload} />
                    </div>
                ) : (
                    <>
                        {/* Graph Visualization Area */}
                        <div className="flex-1 relative bg-black">
                            <GraphView
                                nodes={data.suspicious_accounts}
                                links={data.transactions}
                                onNodeClick={setSelectedNode}
                                focusedRingId={focusedRingId}
                            />

                            {/* Overlay: Fraud Ring Table */}
                            <div className="absolute bottom-6 left-6 w-[600px] max-w-[40vw] max-h-[300px] overflow-hidden rounded-xl shadow-2xl animate-in slide-in-from-bottom-10 pointer-events-auto z-10">
                                <FraudRingTable
                                    rings={data.fraud_rings}
                                    onRingSelect={(id) => {
                                        setFocusedRingId(id === focusedRingId ? null : id);
                                    }}
                                    selectedRingId={focusedRingId}
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        {selectedNode && (
                            <Sidebar
                                node={selectedNode}
                                onClose={() => setSelectedNode(null)}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
