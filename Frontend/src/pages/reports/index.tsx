import React, { useState } from 'react';
import {
    FileText,
    Download,
    Filter,
    FileBox,
    Activity,
    AlertTriangle,
    ArrowRightLeft
} from 'lucide-react';

export default function ReportsPage() {
    const [reportType, setReportType] = useState('anomalies');

    const reportCards = [
        { id: 'anomalies', label: 'Anomaly Reports', icon: AlertTriangle, desc: 'Detailed lists of rule and ML anomalies' },
        { id: 'lapse', label: 'Lapse Predictions', icon: Activity, desc: 'EOFY forecast and risk scores by department' },
        { id: 'budget', label: 'Budget Allocation', icon: FileBox, desc: 'Current allocation and utilization data' },
        { id: 'reallocation', label: 'Transfer Logs', icon: ArrowRightLeft, desc: 'Audit trail of executed reallocations' }
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Report Generator</h1>
                <p className="text-slate-500 mt-1">Export structured financial intelligence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {reportCards.map(rc => (
                    <div
                        key={rc.id}
                        onClick={() => setReportType(rc.id)}
                        className={`border rounded-xl p-5 cursor-pointer transition-all flex flex-col items-center justify-center text-center
              ${reportType === rc.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}
            `}
                    >
                        <div className={`p-3 rounded-full mb-3 ${reportType === rc.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            <rc.icon className="w-6 h-6" />
                        </div>
                        <h3 className={`font-bold ${reportType === rc.id ? 'text-indigo-800' : 'text-slate-800'}`}>{rc.label}</h3>
                        <p className="text-xs text-slate-500 mt-1">{rc.desc}</p>
                    </div>
                ))}
            </div>

            <div className="glass-card flex flex-col md:flex-row gap-8 overflow-hidden">
                <div className="p-8 w-full md:w-1/3 bg-slate-50/50 border-r border-slate-100 flex flex-col gap-6 relative z-10">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Filter className="w-4 h-4" /> Filter Options
                        </h3>

                        <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Fiscal Year</label>
                        <select className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>FY 2024-2025</option>
                            <option>FY 2023-2024</option>
                        </select>

                        <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Department Isolation</label>
                        <select className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>All Departments</option>
                            <option>Education (101)</option>
                            <option>Health (102)</option>
                        </select>

                        {reportType === 'anomalies' && (
                            <>
                                <label className="block text-sm font-semibold text-slate-700 mb-1 mt-4">Severity</label>
                                <select className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option>All Severities</option>
                                    <option>Critical & High Only</option>
                                </select>
                            </>
                        )}
                    </div>

                    <div className="mt-auto space-y-3 pt-6 border-t border-slate-200 flex flex-col gap-2">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-xl shadow font-semibold transition-colors">
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm font-semibold transition-colors">
                            <FileText className="w-4 h-4" /> Export CSV Matrix
                        </button>
                    </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-center items-center text-slate-400 border-dashed border-2 border-slate-100 m-8 rounded-2xl bg-white/30 backdrop-blur-sm relative overflow-hidden">
                    <FileText className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="font-semibold text-lg text-slate-500">Report Preview</p>
                    <p className="text-sm max-w-sm text-center mt-2">The report preview will generate here once you select filters and click generate.</p>
                    <div className="absolute right-[-20%] bottom-[-20%] w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl z-[-1]"></div>
                </div>
            </div>
        </div>
    );
}
