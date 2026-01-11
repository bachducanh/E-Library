'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await authAPI.getMe();
            setUser(response.data);
        } catch (error) {
            console.error('Error loading profile:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
            </h1>

            {/* User Info Card */}
            <div className="glass-dark p-8 rounded-xl">
                <div className="flex items-center space-x-6 mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-4xl text-white font-bold">
                        {user.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
                        <p className="text-white/60">{user.email}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-200' :
                                user.role === 'STAFF' ? 'bg-yellow-500/20 text-yellow-200' :
                                    'bg-blue-500/20 text-blue-200'
                            }`}>
                            {user.role}
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-white/80">
                    <div>
                        <p className="text-white/60 text-sm">Phone</p>
                        <p className="font-semibold">{user.phone}</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Branch</p>
                        <p className="font-semibold">{user.branchId}</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Member Since</p>
                        <p className="font-semibold">{new Date(user.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-sm">Member ID</p>
                        <p className="font-semibold">{user._id}</p>
                    </div>
                </div>
            </div>

            {/* Subscription Card */}
            <div className="glass p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Subscription</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Tier</p>
                        <p className={`font-bold text-lg ${user.subscription?.tier === 'VIP' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                            {user.subscription?.tier || 'BASIC'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Max Loans</p>
                        <p className="font-bold text-lg text-gray-800 dark:text-white">
                            {user.subscription?.maxLoans || 3}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Loan Duration</p>
                        <p className="font-bold text-lg text-gray-800 dark:text-white">
                            {user.subscription?.loanDuration || 14} days
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${user.subscription?.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                        {user.subscription?.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <a
                    href="/loans"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold text-center transition"
                >
                    View My Loans
                </a>
                <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
