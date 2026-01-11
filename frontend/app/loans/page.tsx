'use client';

import { useEffect, useState } from 'react';
import { loansAPI } from '@/lib/api';
import { format } from 'date-fns';

export default function LoansPage() {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');

    useEffect(() => {
        loadLoans();
    }, [filter]);

    const loadLoans = async () => {
        try {
            setLoading(true);
            const response = await loansAPI.getMyLoans(filter);
            setLoans(response.data);
        } catch (error) {
            console.error('Error loading loans:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading loans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Loans
                </h1>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Loans</option>
                    <option value="active">Active</option>
                    <option value="overdue">Overdue</option>
                    <option value="returned">Returned</option>
                </select>
            </div>

            {loans.length === 0 ? (
                <div className="glass p-8 rounded-xl text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-xl text-gray-600 dark:text-gray-300">No loans found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Start borrowing books from the library!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {loans.map((loan: any) => (
                        <div key={loan._id} className="glass p-6 rounded-xl">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                            Loan #{loan._id}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${loan.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                loan.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}>
                                            {loan.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                        <p><span className="font-semibold">Book ID:</span> {loan.bookId}</p>
                                        <p><span className="font-semibold">Copy ID:</span> {loan.copyId}</p>
                                        <p><span className="font-semibold">Branch:</span> {loan.branchId}</p>
                                        <p><span className="font-semibold">Borrowed:</span> {format(new Date(loan.borrowedAt), 'PPP')}</p>
                                        <p><span className="font-semibold">Due:</span> {format(new Date(loan.dueAt), 'PPP')}</p>
                                        {loan.returnedAt && (
                                            <p><span className="font-semibold">Returned:</span> {format(new Date(loan.returnedAt), 'PPP')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
