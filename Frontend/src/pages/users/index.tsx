import React from 'react';
import { Users, Shield, UserCheck, MoreVertical } from 'lucide-react';

export default function UsersPage() {
    const users = [
        { id: 1, name: 'Arjun Mehta', email: 'arjun@meticura.gov', role: 'center_admin', status: 'Active' },
        { id: 2, name: 'Priya Sharma', email: 'priya@meticura.gov', role: 'district_admin', status: 'Active' },
        { id: 3, name: 'Rahul Desai', email: 'rahul@meticura.gov', role: 'dept_admin', status: 'Inactive' },
        { id: 4, name: 'Sneha Patel', email: 'sneha@meticura.gov', role: 'dept_admin', status: 'Active' },
    ];

    return (
        <div className="animate-fade-in pb-12">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Access Control</h1>
                    <p className="text-slate-500 mt-1">Manage RBAC across the coherent infrastructure</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors">
                    Invite User
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="glass-panel p-6 flex flex-col text-center items-center justify-center bg-indigo-50/50">
                    <Shield className="w-8 h-8 text-indigo-500 mb-2" />
                    <h3 className="text-2xl font-bold text-slate-800">4</h3>
                    <p className="text-sm text-slate-500 font-medium">Distinct Roles</p>
                </div>
                <div className="glass-panel p-6 flex flex-col text-center items-center justify-center">
                    <Users className="w-8 h-8 text-blue-500 mb-2" />
                    <h3 className="text-2xl font-bold text-slate-800">24</h3>
                    <p className="text-sm text-slate-500 font-medium">Total Registered Users</p>
                </div>
                <div className="glass-panel p-6 flex flex-col text-center items-center justify-center">
                    <UserCheck className="w-8 h-8 text-emerald-500 mb-2" />
                    <h3 className="text-2xl font-bold text-slate-800">20</h3>
                    <p className="text-sm text-slate-500 font-medium">Active Accounts</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">User Details</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Assigned Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                            <th className="px-6 py-4 text-right">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{u.name}</p>
                                    <p className="text-xs text-slate-500">{u.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase
                    ${u.role === 'center_admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
                  `}>
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-slate-600 font-medium">{u.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
