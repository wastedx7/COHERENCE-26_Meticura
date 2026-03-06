import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReallocation } from '../../context/ReallocationContext';
import { ChevronLeft, CheckCircle2, XCircle, ArrowRightLeft, FileText, PlayCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function SuggestionDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchSuggestion, selectedSuggestion, approve, reject, execute, isLoading } = useReallocation();
    const { role } = useAuth();
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (id) fetchSuggestion(Number(id));
    }, [id, fetchSuggestion]);

    const suggestion = selectedSuggestion || {
        id: id,
        donor_department_id: 45,
        recipient_department_id: 112,
        suggested_amount: 250000,
        donor_predicted_lapse: 360000,
        recipient_predicted_deficit: 310000,
        priority: 'high',
        status: 'pending',
        reason: 'Dept 45 projected 28% lapse (₹3.6L unspent). Dept 112 projected deficit of ₹3.1L with 80 days remaining. Same-district transfer recommended.',
        same_district: true
    };

    const handleAction = async (action: 'approve' | 'reject' | 'execute') => {
        if (action === 'approve') await approve(Number(id), notes);
        if (action === 'reject') await reject(Number(id), notes);
        if (action === 'execute') await execute(Number(id));
        navigate('/reallocation');
    };

    const canApprove = role === 'center_admin' || role === 'district_admin';
    const canExecute = role === 'center_admin';

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/reallocation" className="p-2 glass-card hover:bg-slate-50 rounded-full transition-colors text-slate-500 hover:text-indigo-600">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">Transfer Proposal #{suggestion.id}</h1>
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full border 
              ${suggestion.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                suggestion.status === 'approved' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                            {suggestion.status}
                        </span>
                    </div>
                    <p className="text-slate-500 mt-1">Review the AI justification and take action</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-panel p-8 relative overflow-hidden flex flex-col justify-center border border-indigo-100">
                    <div className="absolute right-[-20%] bottom-[-20%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl min-opacity-60 z-0"></div>

                    <div className="flex flex-col items-center justify-center relative z-10 space-y-6">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">Transfer Amount</p>
                        <span className="text-6xl font-black text-indigo-600 tracking-tighter">₹{(suggestion.suggested_amount / 100000).toFixed(2)}L</span>

                        <div className="w-full flex justify-between items-center mt-8 pt-6 border-t border-slate-200 gap-4">
                            <div className="flex-1 text-center bg-white/60 backdrop-blur border border-slate-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Donor Surplus</p>
                                <p className="text-xl font-bold text-emerald-600">₹{(suggestion.donor_predicted_lapse / 100000).toFixed(1)}L</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Dept {suggestion.donor_department_id}</p>
                            </div>

                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="flex-1 text-center bg-white/60 backdrop-blur border border-slate-200 rounded-xl p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient Deficit</p>
                                <p className="text-xl font-bold text-rose-600">₹{(suggestion.recipient_predicted_deficit / 100000).toFixed(1)}L</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Dept {suggestion.recipient_department_id}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="glass-card p-6 flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> AI Justification String</h3>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 leading-relaxed font-medium">
                            {suggestion.reason}
                        </div>
                        {suggestion.same_district && (
                            <div className="mt-4 inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded border border-blue-200">
                                Same District Priority Applied
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-6 flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Action Panel</h3>
                        {suggestion.status === 'pending' && canApprove && (
                            <div className="space-y-4">
                                <textarea
                                    placeholder="Enter explicit approval/rejection notes..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => handleAction('approve')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <CheckCircle2 className="w-5 h-5" /> Approve
                                    </button>
                                    <button onClick={() => handleAction('reject')} className="flex-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-center">
                                        <XCircle className="w-5 h-5" /> Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {suggestion.status === 'approved' && canExecute && (
                            <div className="space-y-4">
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 font-medium">
                                    This transfer has been approved and is awaiting final execution to move funds. This cannot be undone.
                                </div>
                                <button onClick={() => handleAction('execute')} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg">
                                    <PlayCircle className="w-5 h-5" /> Execute Transfer Formally
                                </button>
                            </div>
                        )}

                        {(!canApprove && suggestion.status === 'pending') || (!canExecute && suggestion.status === 'approved') ? (
                            <div className="bg-slate-100 text-slate-500 italic text-sm p-4 rounded-xl text-center">
                                You do not have the required permissions to action this step.
                            </div>
                        ) : null}

                        {suggestion.status === 'executed' && (
                            <div className="bg-emerald-50 text-emerald-700 font-bold p-6 rounded-xl text-center text-lg flex flex-col items-center justify-center shadow-inner border border-emerald-100">
                                <CheckCircle2 className="w-12 h-12 mb-2" />
                                Transfer Successfully Executed
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
