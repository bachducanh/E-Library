'use client';

import Link from 'next/link';
import { Inter, Roboto } from 'next/font/google';
import './globals.css';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Book, LayoutDashboard, Library, User, LogOut, LogIn, Menu, Shield } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');

        if (token) {
            setIsLoggedIn(true);
            if (userData) {
                setUser(JSON.parse(userData));
            }
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        router.push('/');
    };

    return (
        <html lang="en">
            <body className={`${inter.variable} ${roboto.variable} font-sans min-h-screen flex flex-col`}>
                {/* Navbar */}
                <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                                    <Book className="w-8 h-8 text-brand-red" />
                                    <span className="text-2xl font-bold text-brand-red tracking-tight">E-LIBRARY</span>
                                </Link>
                                <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                                    <Link href="/books" className="border-transparent text-gray-700 hover:text-brand-blue hover:border-brand-blue inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors gap-2">
                                        <Book className="w-4 h-4" />
                                        Explore Books
                                    </Link>
                                    <Link href="/dashboard" className="border-transparent text-gray-700 hover:text-brand-blue hover:border-brand-blue inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Community
                                    </Link>
                                    {isLoggedIn && (
                                        <Link href="/loans" className="border-transparent text-gray-700 hover:text-brand-blue hover:border-brand-blue inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors gap-2">
                                            <Library className="w-4 h-4" />
                                            My Library
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                {isLoggedIn ? (
                                    <div className="flex items-center space-x-4">
                                        {user?.role === 'ADMIN' && (
                                            <Link href="/admin" className="text-sm font-medium text-brand-blue hover:text-brand-red transition-colors flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Admin Portal
                                            </Link>
                                        )}
                                        <div className="relative group">
                                            <button className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-brand-blue transition-colors">
                                                <span className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold border border-brand-blue/20">
                                                    {user?.fullName?.[0]}
                                                </span>
                                                <span className="hidden md:block">{user?.fullName}</span>
                                            </button>
                                            <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-gray-100 ring-1 ring-black ring-opacity-5 z-50">
                                                <div className="px-4 py-3 border-b border-gray-100">
                                                    <p className="text-xs text-gray-500">Signed in as</p>
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                                                </div>
                                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <User className="w-4 h-4" /> Your Profile
                                                </Link>
                                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-brand-red hover:bg-red-50 flex items-center gap-2">
                                                    <LogOut className="w-4 h-4" /> Sign out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <Link href="/login" className="text-brand-blue hover:text-brand-dark px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                                            <LogIn className="w-4 h-4" />
                                            Log In
                                        </Link>
                                        <Link href="/register" className="bg-brand-red hover:bg-red-700 text-white px-5 py-2 rounded text-sm font-bold transition-transform transform hover:-translate-y-0.5 shadow-sm">
                                            Join for Free
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-grow bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-brand-dark text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1 md:col-span-1">
                                <span className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <Book className="w-6 h-6 text-brand-red" />
                                    E-LIBRARY
                                </span>
                                <p className="mt-4 text-sm text-gray-400">
                                    Empowering learners through access to knowledge. Connected libraries, limitless possibilities.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Resources</h3>
                                <ul className="mt-4 space-y-2">
                                    <li><Link href="/books" className="text-base text-gray-400 hover:text-white transition-colors">Catalog</Link></li>
                                    <li><Link href="#" className="text-base text-gray-400 hover:text-white transition-colors">Advanced Search</Link></li>
                                    <li><Link href="/dashboard" className="text-base text-gray-400 hover:text-white transition-colors">Analytics</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Locations</h3>
                                <ul className="mt-4 space-y-2">
                                    <li><span className="text-base text-gray-400">Hà Nội HQ</span></li>
                                    <li><span className="text-base text-gray-400">Đà Nẵng Branch</span></li>
                                    <li><span className="text-base text-gray-400">Hồ Chí Minh Campus</span></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Legal</h3>
                                <ul className="mt-4 space-y-2">
                                    <li><Link href="#" className="text-base text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="#" className="text-base text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 border-t border-gray-700 pt-8 flex justify-between items-center">
                            <p className="text-sm text-gray-400">
                                &copy; 2026 E-Library. All rights reserved.
                            </p>
                            <div className="flex space-x-6">
                                {/* Social icons could go here */}
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
