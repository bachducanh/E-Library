'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        branchId: 'HN'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authAPI.register(formData);
            // Auto login after registration
            const loginResponse = await authAPI.login(formData.email, formData.password);
            localStorage.setItem('access_token', loginResponse.data.access_token);

            // Get user info and save to localStorage
            const userResponse = await authAPI.getMe();
            localStorage.setItem('user', JSON.stringify(userResponse.data));

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="glass-dark p-8 rounded-xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white mb-6 text-center">Register</h1>

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

                    <div>
                        <label className="block text-white/80 mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Nguyen Van A"
                        />
                    </div>

                    <div>
                        <label className="block text-white/80 mb-2">Phone</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="0901234567"
                        />
                    </div>

                    <div>
                        <label className="block text-white/80 mb-2">Branch</label>
                        <select
                            value={formData.branchId}
                            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="HN" className="bg-gray-800">Hà Nội</option>
                            <option value="HP" className="bg-gray-800">Hải Phòng</option>
                            <option value="DN" className="bg-gray-800">Đà Nẵng</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-white/60 text-center mt-4">
                    Already have an account?{' '}
                    <a href="/login" className="text-primary-400 hover:text-primary-300">
                        Login here
                    </a>
                </p>
            </div>
        </div>
    );
}
