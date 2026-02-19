
import React from 'react';
import { AlertTriangle, ChevronRight, Users, Activity } from 'lucide-react';
import { FraudRing } from '../types';

interface FraudRingTableProps {
    rings: FraudRing[];
    onRingSelect: (ringId: string) => void;
    selectedRingId: string | null;
}

export const FraudRingTable: React.FC<FraudRingTableProps> = ({ rings, onRingSelect, selectedRingId }) => {
    if (rings.length === 0) return null;

    // Deduplicate rings if needed, or sort by risk
    const sortedRings = [...rings].sort((a, b) => b.risk_score - a.risk_score);

    return (
        <div className="bg-gray-900 border border-gray-800 flex flex-col h-full rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={16} />
                        Detected Rings ({rings.length})
                    </h3>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-950 sticky top-0 font-medium">
                        <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Score</th>
                            <th className="px-4 py-3">Members</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sortedRings.map(ring => (
                            <tr
                                key={ring.ring_id}
                                onClick={() => onRingSelect(ring.ring_id)}
                                className={`cursor-pointer transition-colors hover:bg-gray-800/60 ${selectedRingId === ring.ring_id ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''}`}
                            >
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ring.pattern_type === 'CYCLE' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                            ring.pattern_type === 'FAN_IN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                                'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                        }`}>
                                        {ring.pattern_type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-400">{ring.ring_id.substring(0, 8)}...</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex-1 h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500" style={{ width: `${ring.risk_score}%` }}></div>
                                        </div>
                                        <span className="text-xs font-mono text-gray-300">{ring.risk_score}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Users size={12} />
                                        {ring.member_ids.length}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <ChevronRight size={14} className={`text-gray-600 ${selectedRingId === ring.ring_id ? 'text-blue-400' : ''}`} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
