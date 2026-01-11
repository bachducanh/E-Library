'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData.email, formData.password);
            localStorage.setItem('access_token', response.data.access_token);

            // Get user info and save to localStorage
            const userResponse = await authAPI.getMe();
            localStorage.setItem('user', JSON.stringify(userResponse.data));

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="glass-dark p-8 rounded-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-white/80 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-white/80 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 space-y-3">
                    <p className="text-white/60 text-center">
                        Don't have an account?{' '}
                        <a href="/register" className="text-primary-400 hover:text-primary-300">
                            Register here
                        </a>
                    </p>

                    <div className="border-t border-white/20 pt-4">
                        <p className="text-white/60 text-sm text-center mb-2">Demo Accounts:</p>
                        <div className="space-y-1 text-xs text-white/50">
                            <p>Admin: admin@elibrary.vn / admin123</p>
                            <p>Member: member1@example.com / password123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
