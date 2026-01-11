'use client';

import Link from 'next/link';
import { Globe, BookOpen, Clock, Users, BookMarked, GraduationCap, ChevronRight, Activity } from 'lucide-react';

export default function Home() {
    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <div className="relative py-20 px-6 rounded-2xl bg-brand-dark overflow-hidden text-center text-white shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        Unlock Your Potential with <span className="text-brand-red">E-Library</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl mx-auto">
                        Access thousands of books, research papers, and resources from our distributed network across 3 major cities.
                    </p>
                    <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/books" className="bg-brand-red hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-transform transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Explore Catalog
                        </Link>
                        <Link href="/register" className="bg-transparent border-2 border-white hover:bg-white hover:text-brand-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2">
                            <Users className="w-5 h-5" />
                            Join for Free
                        </Link>
                    </div>
                </div>
            </div>

            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                        <Globe className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-3">Distributed Access</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Seamlessly borrow materials from Hà Nội, Đà Nẵng, or TP.HCM. Our smart sharding system ensures data is always near you.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="w-14 h-14 bg-red-50 text-brand-red rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-red group-hover:text-white transition-colors">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-3">Instant Digital Library</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Premium members get instant access to our vast e-book collection. Read anywhere, anytime, on any device.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                    <div className="w-14 h-14 bg-teal-50 text-brand-teal rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-teal group-hover:text-white transition-colors">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-3">Curated Collections</h3>
                    <p className="text-gray-600 leading-relaxed">
                        Expertly organized resources using Library of Congress Classification (LCC) for serious researchers and students.
                    </p>
                </div>
            </div>

            {/* Impact Stats */}
            <div className="bg-brand-blue rounded-2xl p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5">
                    <Activity className="w-96 h-96 -mr-20 -mt-20" />
                </div>
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">10k+</div>
                        <div className="text-blue-200 uppercase tracking-widest text-sm font-semibold flex items-center justify-center gap-2">
                            <BookMarked className="w-4 h-4" /> Books
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
                        <div className="text-blue-200 uppercase tracking-widest text-sm font-semibold flex items-center justify-center gap-2">
                            <Globe className="w-4 h-4" /> Campuses
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">5k+</div>
                        <div className="text-blue-200 uppercase tracking-widest text-sm font-semibold flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" /> Members
                        </div>
                    </div>
                    <div>
                        <div className="text-4xl md:text-5xl font-bold mb-2">99.9%</div>
                        <div className="text-blue-200 uppercase tracking-widest text-sm font-semibold flex items-center justify-center gap-2">
                            <Activity className="w-4 h-4" /> Uptime
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="text-center py-12">
                <h2 className="text-3xl font-bold text-brand-dark mb-6">Ready to start learning?</h2>
                <Link href="/books" className="inline-flex items-center gap-2 border-b-2 border-brand-red text-brand-red font-bold text-lg hover:text-red-800 transition-colors">
                    Browse our full catalog <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
    )
}
