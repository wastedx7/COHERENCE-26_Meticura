import React from 'react';
import { UploadCloud, FileSpreadsheet, PlusCircle } from 'lucide-react';

export default function TransactionsPage() {
    return (
        <div className="animate-fade-in pb-12 max-w-4xl mx-auto">
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Ingestion</h1>
                <p className="text-slate-500 mt-1">Manual entry and bulk CSV upload for transactions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="glass-panel p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-300 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Bulk Upload CSV</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs">Upload standardized `.csv` ledgers directly. The parser will handle cleaning and engine insertion.</p>
                    <button className="mt-8 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm font-medium w-full flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                        <FileSpreadsheet className="w-5 h-5" /> Select File
                    </button>
                </div>

                <div className="glass-card p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-300 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <PlusCircle className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Manual Entry Form</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs">Input a single targeted transaction via the secure manual form. Useful for emergency corrections.</p>
                    <button className="mt-8 px-6 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-lg shadow-sm font-medium w-full flex items-center justify-center gap-2 hover:bg-black transition-colors">
                        Open Web Form
                    </button>
                </div>
            </div>
        </div>
    );
}
