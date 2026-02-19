
import React from 'react';
import { X, ShieldAlert, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { AccountNode } from '../types';

interface SidebarProps {
    node: AccountNode;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ node, onClose }) => {
    return (
        <div className="w-[400px] border-l border-gray-800 bg-gray-900/95 backdrop-blur-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold font-mono text-white">{node.id}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${node.risk_score > 80 ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                node.risk_score > 50 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                                    'bg-green-500/20 text-green-400 border border-green-500/50'
                            }`}>
                            RISK SCORE: {node.risk_score.toFixed(0)}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Patterns */}
                {node.patterns.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detected Patterns</h3>
                        {node.patterns.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded bg-red-950/30 border border-red-900/50">
                                <ShieldAlert className="text-red-500" size={18} />
                                <span className="text-sm font-medium text-red-200">{p}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <ArrowLeft size={14} className="text-green-400" />
                            <span className="text-xs font-medium">INFLOW</span>
                        </div>
                        <div className="text-2xl font-mono text-white">${node.total_in_volume.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">{node.in_degree} Transactions</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2 text-gray-400">
                            <ArrowRight size={14} className="text-red-400" />
                            <span className="text-xs font-medium">OUTFLOW</span>
                        </div>
                        <div className="text-2xl font-mono text-white">${node.total_out_volume.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">{node.out_degree} Transactions</div>
                    </div>
                </div>

                {/* Ring Memberships */}
                {node.ring_ids.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ring Memberships</h3>
                        <div className="flex flex-wrap gap-2">
                            {node.ring_ids.map(id => (
                                <span key={id} className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                                    {id}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transactions Preview */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Transactions</h3>
                    <div className="space-y-2">
                        {node.transactions.slice(0, 10).map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all text-xs">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Clock size={12} />
                                    <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="font-mono">
                                    {t.sender_id === node.id ? (
                                        <span className="text-red-400 flex items-center gap-1">
                                            -${t.amount.toLocaleString()} <ArrowRight size={10} /> {t.receiver_id.substring(0, 6)}...
                                        </span>
                                    ) : (
                                        <span className="text-green-400 flex items-center gap-1">
                                            +${t.amount.toLocaleString()} <ArrowLeft size={10} /> {t.sender_id.substring(0, 6)}...
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {node.transactions.length > 10 && (
                            <div className="text-center text-xs text-gray-500 pt-2">
                                +{node.transactions.length - 10} more transactions
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
