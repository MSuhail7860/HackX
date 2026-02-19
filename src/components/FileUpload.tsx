
import React, { useCallback } from 'react';
import * as Papa from 'papaparse';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { AnalysisEngine } from '../engine/AnalysisEngine';
import { Transaction, AnalysisResult } from '../types/index';

interface FileUploadProps {
    onFileUpload: (data: AnalysisResult) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {

    const handleFile = useCallback((file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                // Validate and map data
                const transactions: Transaction[] = results.data.map((row: any) => ({
                    transaction_id: row.transaction_id || `tx-${Math.random()}`,
                    sender_id: row.sender_id,
                    receiver_id: row.receiver_id,
                    amount: parseFloat(row.amount),
                    timestamp: row.timestamp
                })).filter((t: Transaction) => t.sender_id && t.receiver_id && !isNaN(t.amount));

                // Process Data
                const engine = new AnalysisEngine();
                const analysisResult = engine.runAnalysis(transactions);

                onFileUpload(analysisResult);
            },
            error: (error: Error) => {
                console.error("CSV Parsing Error:", error);
                alert("Failed to parse CSV file.");
            }
        });
    }, [onFileUpload]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/csv') {
            handleFile(file);
        }
    };

    return (
        <div
            className="w-full max-w-xl mx-auto p-1 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-xl cursor-pointer group hover:scale-[1.01] transition-transform duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => document.getElementById('csv-upload')?.click()}
        >
            <div className="bg-slate-950/90 backdrop-blur-xl border border-blue-500/30 dashed-border rounded-lg p-12 text-center relative overflow-hidden">

                {/* Scanner Line Animation */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[scan_3s_linear_infinite] opacity-0 group-hover:opacity-100"></div>

                <div className="inline-flex p-4 rounded-full bg-blue-500/10 mb-6 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500">
                    <Upload className="w-8 h-8 text-blue-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                    INITIATE DATA INGESTION
                </h3>

                <p className="text-sm text-gray-400 mb-6 font-light">
                    Drag .CSV file to decrypt or <span className="text-blue-400 group-hover:underline">browse local drive</span>
                </p>

                <div className="bg-black/50 border border-white/5 rounded p-3 text-left font-mono text-[10px] text-gray-500 max-w-sm mx-auto">
                    <div className="flex justify-between border-b border-white/5 pb-1 mb-2">
                        <span>REQUIRED_SCHEMA</span>
                        <span className="text-green-500">READY</span>
                    </div>
                    <code className="block text-gray-400">transaction_id, sender_id, receiver_id</code>
                    <code className="block text-gray-400">amount, timestamp</code>
                </div>

                <input
                    id="csv-upload"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
            </div>
        </div>
    );
};
