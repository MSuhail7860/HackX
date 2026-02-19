
import React from 'react';
import { AlertTriangle, ChevronRight, Users, Activity } from 'lucide-react';
import { FraudRing } from '../types/index';

interface FraudRingTableProps {
    rings: FraudRing[];
    onRingSelect: (ringId: string) => void;
    selectedRingId: string | null;
}

export const FraudRingTable: React.FC<FraudRingTableProps> = ({ rings, onRingSelect, selectedRingId }) => {
    if (rings.length === 0) return null;

    // Deduplicate rings if needed, or sort by risk
    const sortedRings = [...rings].sort((a, b) => b.risk_score - a.risk_score);

    // State for expanded row logic (Explainability)
    const [expandedRingId, setExpandedRingId] = React.useState<string | null>(null);

    const toggleExpand = (e: React.MouseEvent, ringId: string) => {
        e.stopPropagation();
        setExpandedRingId(expandedRingId === ringId ? null : ringId);
    };


    return (
        <div className="flex flex-col h-full bg-slate-950/50">
            <div className="p-3 border-b border-white/5 bg-slate-900/50 backdrop-blur sticky top-0 z-10 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                    <AlertTriangle className="text-red-500" size={14} />
                    DETECTED_RINGS <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px]">{rings.length}</span>
                </h3>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="text-[10px] text-gray-500 uppercase bg-slate-950/80 sticky top-0 font-bold z-10 tracking-wider">
                        <tr>
                            <th className="px-4 py-2 border-b border-white/5">Pattern</th>
                            <th className="px-4 py-2 border-b border-white/5">ID</th>
                            <th className="px-4 py-2 border-b border-white/5">Threat Lvl</th>
                            <th className="px-4 py-2 border-b border-white/5">Nodes</th>
                            <th className="px-4 py-2 border-b border-white/5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                        {sortedRings.map((ring, idx) => (
                            <React.Fragment key={`${ring.ring_id}-${idx}`}>
                                <tr
                                    onClick={() => onRingSelect(ring.ring_id)}
                                    className={`cursor-pointer transition-all duration-200 group hover:bg-blue-600/10 ${selectedRingId === ring.ring_id ? 'bg-blue-600/20 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
                                >
                                    <td className="px-4 py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${ring.pattern_type === 'CYCLE' ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10' :
                                            ring.pattern_type === 'FAN_IN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                                'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                            }`}>
                                            {ring.pattern_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-400 group-hover:text-blue-300 transition-colors">
                                        {ring.ring_id.substring(0, 8)}...
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${ring.risk_score > 80 ? 'text-red-500' : ring.risk_score > 50 ? 'text-yellow-500' : 'text-green-500'}`}></div>
                                            <span className={`font-bold ${ring.risk_score > 80 ? 'text-red-500' : 'text-gray-300'}`}>{ring.risk_score.toFixed(0)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {ring.member_ids.length}
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <button
                                            onClick={(e) => toggleExpand(e, ring.ring_id)}
                                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                                        >
                                            <ChevronRight size={14} className={`transform transition-transform ${expandedRingId === ring.ring_id ? 'rotate-90' : ''}`} />
                                        </button>
                                    </td>
                                </tr>
                                {/* Explainability Row */}
                                {expandedRingId === ring.ring_id && (
                                    <tr className="bg-slate-900/80">
                                        <td colSpan={5} className="px-4 py-3 border-b border-white/5 animate-in slide-in-from-top-2 duration-200">
                                            <div className="bg-black/40 rounded border border-white/5 p-3 text-xs">
                                                <div className="grid grid-cols-3 gap-4 mb-2">
                                                    <div>
                                                        <span className="text-[9px] text-gray-500 uppercase block mb-0.5">Total Volume</span>
                                                        <span className="text-gray-200 font-mono font-bold text-glow">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(ring.total_volume)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-gray-500 uppercase block mb-0.5">Vector Size</span>
                                                        <span className="text-gray-200 font-mono">{ring.member_ids.length} Nodes</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-gray-500 uppercase block mb-0.5">Pattern Sig</span>
                                                        <span className="text-blue-400 font-mono">{ring.pattern_type}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-gray-500 uppercase block mb-1">Analysis / Reasoning</span>
                                                    <p className="text-gray-400 italic leading-relaxed border-l-2 border-red-500/20 pl-2">
                                                        "{ring.pattern_type === 'CYCLE' ? `High-certainty circular flow detected with ${ring.member_ids.length} hops. Automated looping behavior.` :
                                                            ring.pattern_type.includes('FAN') ? `Abnormal transaction density detected within strict 72h window. Potential money mule operation.` :
                                                                `Layered shell accounts detected with low individual volume but structured checks.`}"
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};