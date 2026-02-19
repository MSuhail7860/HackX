
import React, { useCallback } from 'react';
import * as Papa from 'papaparse';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { AnalysisEngine } from '../engine/AnalysisEngine';
import { Transaction, AnalysisResult } from '../types';

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
            className="w-full max-w-xl mx-auto p-12 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 hover:bg-gray-800/50 hover:border-blue-500 transition-all cursor-pointer group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
        >
            <div className="flex flex-col items-center justify-center text-center gap-4">
                <div className="p-4 bg-gray-800 rounded-full group-hover:bg-blue-500/20 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Upload Transaction CSV</h3>
                    <p className="text-sm text-gray-400 mt-1">Drag & drop or <label className="text-blue-400 hover:text-blue-300 cursor-pointer hover:underline"><input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />browse files</label></p>
                </div>

                <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs text-left text-gray-500 font-mono border border-gray-800">
                    <p className="flex items-center gap-2 mb-1"><FileText size={12} /> Required Columns:</p>
                    <code className="text-gray-400">transaction_id, sender_id, receiver_id, amount, timestamp</code>
                </div>
            </div>
        </div>
    );
};
