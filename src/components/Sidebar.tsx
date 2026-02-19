
import React from 'react';
import { X, ShieldAlert, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { AccountNode } from '../types/index';

interface SidebarProps {
    node: AccountNode;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ node, onClose }) => {
    return (
        <div className="w-full h-full flex flex-col bg-slate-950/80 backdrop-blur-xl animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-start justify-between bg-gradient-to-r from-slate-900 to-transparent">
                <div>
                    <h2 className="text-2xl font-black font-mono text-white tracking-tighter">{node.id}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider box-glow ${node.risk_score > 80 ? 'bg-red-500 text-black shadow-[0_0_10px_#ef4444]' :
                            node.risk_score > 50 ? 'bg-yellow-400 text-black shadow-[0_0_10px_#facc15]' :
                                'bg-green-500 text-black shadow-[0_0_10px_#22c55e]'
                            }`}>
                            Risk Score: {node.risk_score.toFixed(0)}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors hover:rotate-90 duration-300">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

                {/* Patterns */}
                {node.patterns.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                            <ShieldAlert size={12} className="text-red-500" /> Detected Threats
                        </h3>
                        {node.patterns.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-950/30 border border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                                <ShieldAlert className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" size={16} />
                                <span className="text-xs font-bold text-red-200 font-mono tracking-tight">{p}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ArrowLeft size={40} />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <ArrowLeft size={12} className="text-green-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Inflow</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-white text-glow">${node.total_in_volume.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1 font-mono">{node.in_degree} Txs</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/50 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ArrowRight size={40} />
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <ArrowRight size={12} className="text-red-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Outflow</span>
                        </div>
                        <div className="text-lg font-mono font-bold text-white text-glow">${node.total_out_volume.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500 mt-1 font-mono">{node.out_degree} Txs</div>
                    </div>
                </div>

                {/* Centrality & Influence */}
                <div className="p-4 rounded-lg bg-slate-900/50 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Network Centrality</span>
                        <span className="text-xs font-mono text-blue-400 font-bold">{(node.centrality * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" style={{ width: `${node.centrality * 100}%` }}></div>
                    </div>
                </div>

                {/* Activity Chart Viz */}
                <div className="space-y-2">
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Velocity Histogram</h3>
                    <div className="h-24 flex items-end gap-1 border-b border-white/10 pb-1 px-1">
                        {(() => {
                            const txs = node.transactions.slice(0, 20);
                            const maxAmt = Math.max(...txs.map(t => t.amount), 100);
                            return txs.map((t, i) => (
                                <div key={i} className="flex-1 bg-slate-800 hover:bg-blue-500 transition-all rounded-t-sm relative group"
                                    style={{ height: `${(t.amount / maxAmt) * 100}%` }}>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-[9px] px-1 py-0.5 rounded border border-white/10 opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 font-mono text-blue-400">
                                        ${t.amount}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Ring Memberships */}
                {node.ring_ids.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ring Affiliations</h3>
                        <div className="flex flex-wrap gap-2">
                            {node.ring_ids.map(id => (
                                <span key={id} className="px-2 py-1 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono hover:bg-indigo-500/20 cursor-default transition-colors">
                                    #{id}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transactions Preview */}
                <div className="space-y-2">
                    <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Latest Ledger</h3>
                    <div className="space-y-1">
                        {node.transactions.slice(0, 8).map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-[10px] group cursor-pointer">
                                <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-300">
                                    <Clock size={10} />
                                    <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="font-mono font-medium">
                                    {t.sender_id === node.id ? (
                                        <span className="text-red-400 flex items-center gap-1">
                                            -${t.amount.toLocaleString()} <ArrowRight size={8} /> <span className="text-gray-500">{t.receiver_id.substring(0, 4)}</span>
                                        </span>
                                    ) : (
                                        <span className="text-green-400 flex items-center gap-1">
                                            +${t.amount.toLocaleString()} <ArrowLeft size={8} /> <span className="text-gray-500">{t.sender_id.substring(0, 4)}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
