import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, PlusCircle, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../../lib/api';

interface TxnRow { dept_id: string; amount: string; category: string; description: string; date: string }

export default function TransactionsPage() {
    /* ---------- manual form ---------- */
    const [form, setForm] = useState({ dept_id: '', amount: '', category: '', description: '', date: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [showForm, setShowForm] = useState(false);

    /* ---------- csv upload ---------- */
    const fileRef = useRef<HTMLInputElement>(null);
    const [csvRows, setCsvRows] = useState<TxnRow[]>([]);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);

    /* ---------- departments for dropdown ---------- */
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    useEffect(() => {
        api.get('/budget/?limit=200').then(res => {
            const budgets = res.data?.budgets || [];
            setDepartments(budgets.map((b: any) => ({ id: b.department_id, name: b.department_name })));
        }).catch(() => {});
    }, []);

    /* ---------- CSV parsing ---------- */
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFile(file);
        setUploadProgress(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.trim().split('\n');
            if (lines.length < 2) return;
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const rows: TxnRow[] = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                rows.push({
                    dept_id: cols[headers.indexOf('dept_id')] || cols[0] || '',
                    amount: cols[headers.indexOf('amount')] || cols[1] || '',
                    category: cols[headers.indexOf('category')] || cols[2] || '',
                    description: cols[headers.indexOf('description')] || cols[3] || '',
                    date: cols[headers.indexOf('date')] || cols[4] || '',
                });
            }
            setCsvRows(rows);
        };
        reader.readAsText(file);
    };

    /* ---------- CSV upload execution ---------- */
    const uploadCsv = useCallback(async () => {
        if (!csvRows.length) return;
        setUploadLoading(true);
        const errors: string[] = [];
        let done = 0;
        setUploadProgress({ done: 0, total: csvRows.length, errors: [] });

        for (const row of csvRows) {
            try {
                await api.post(`/budget/departments/${row.dept_id}/transactions`, {
                    amount: parseFloat(row.amount),
                    category: row.category || 'General',
                    description: row.description || undefined,
                    transaction_date: row.date || undefined,
                });
            } catch (e: any) {
                errors.push(`Row dept=${row.dept_id}: ${e?.response?.data?.detail || e.message}`);
            }
            done++;
            setUploadProgress({ done, total: csvRows.length, errors: [...errors] });
        }
        setUploadLoading(false);
    }, [csvRows]);

    /* ---------- manual submit ---------- */
    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.dept_id || !form.amount || !form.category) {
            setFormMsg({ ok: false, text: 'Department, amount, and category are required' });
            return;
        }
        setFormLoading(true);
        setFormMsg(null);
        try {
            await api.post(`/budget/departments/${form.dept_id}/transactions`, {
                amount: parseFloat(form.amount),
                category: form.category,
                description: form.description || undefined,
                transaction_date: form.date || undefined,
            });
            setFormMsg({ ok: true, text: 'Transaction created successfully' });
            setForm({ dept_id: '', amount: '', category: '', description: '', date: '' });
        } catch (e: any) {
            setFormMsg({ ok: false, text: e?.response?.data?.detail || 'Failed to create transaction' });
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-5xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Ingestion</h1>
                <p className="text-slate-500 mt-1">Manual entry and bulk CSV upload for transactions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* --------- CSV UPLOAD CARD --------- */}
                <div className="glass-panel p-8 flex flex-col items-center text-center group hover:border-indigo-300 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Bulk Upload CSV</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs">
                        Upload a <code className="bg-slate-100 px-1 rounded">.csv</code> with columns: <code className="bg-slate-100 px-1 rounded">dept_id, amount, category, description, date</code>
                    </p>

                    <input type="file" accept=".csv" ref={fileRef} onChange={handleFile} className="hidden" />
                    <button onClick={() => fileRef.current?.click()}
                        className="mt-8 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm font-medium w-full flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-colors">
                        <FileSpreadsheet className="w-5 h-5" /> {csvFile ? csvFile.name : 'Select File'}
                    </button>

                    {csvRows.length > 0 && (
                        <div className="mt-4 w-full">
                            <p className="text-sm text-slate-600 mb-2">{csvRows.length} rows parsed</p>
                            <div className="max-h-32 overflow-y-auto text-xs text-left bg-slate-50 rounded border p-2 custom-scrollbar">
                                {csvRows.slice(0, 5).map((r, i) => (
                                    <div key={i} className="text-slate-600">Dept {r.dept_id} | ₹{r.amount} | {r.category}</div>
                                ))}
                                {csvRows.length > 5 && <div className="text-slate-400">...and {csvRows.length - 5} more</div>}
                            </div>
                            <button onClick={uploadCsv} disabled={uploadLoading}
                                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-medium w-full flex items-center justify-center gap-2 transition-colors">
                                {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                Upload {csvRows.length} Transactions
                            </button>
                        </div>
                    )}

                    {uploadProgress && (
                        <div className="mt-4 w-full">
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} />
                            </div>
                            <p className="text-xs text-slate-600">{uploadProgress.done}/{uploadProgress.total} processed</p>
                            {uploadProgress.errors.length > 0 && (
                                <div className="mt-2 text-xs text-red-600 max-h-20 overflow-y-auto">
                                    {uploadProgress.errors.map((e, i) => <div key={i}>{e}</div>)}
                                </div>
                            )}
                            {uploadProgress.done === uploadProgress.total && uploadProgress.errors.length === 0 && (
                                <div className="flex items-center gap-1 text-emerald-600 text-sm mt-2"><CheckCircle2 className="w-4 h-4" /> All uploaded successfully!</div>
                            )}
                        </div>
                    )}
                </div>

                {/* --------- MANUAL ENTRY CARD --------- */}
                <div className="glass-card p-8 flex flex-col items-center text-center group hover:border-indigo-300 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <PlusCircle className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Manual Entry Form</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs">Input a single transaction via the secure manual form.</p>

                    {!showForm ? (
                        <button onClick={() => setShowForm(true)}
                            className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-lg shadow-sm font-medium w-full flex items-center justify-center gap-2 hover:bg-black transition-colors">
                            Open Web Form
                        </button>
                    ) : (
                        <form onSubmit={submitForm} className="mt-4 w-full text-left space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Department *</label>
                                <select value={form.dept_id} onChange={e => setForm({ ...form, dept_id: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Select department...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} (#{d.id})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount (₹) *</label>
                                    <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="10000" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Category *</label>
                                    <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Operations" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</label>
                                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional note..." />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</label>
                                <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            {formMsg && (
                                <div className={`flex items-center gap-2 text-sm p-2 rounded ${formMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                    {formMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {formMsg.text}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button type="submit" disabled={formLoading}
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />} Submit
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
