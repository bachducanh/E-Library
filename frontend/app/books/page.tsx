'use client';

import { useState, useEffect } from 'react';
import { booksAPI } from '@/lib/api';
import Link from 'next/link';
import { Search, BookOpen, User, Tag, Filter, X } from 'lucide-react';

export default function BooksPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Reload books when filters change (except search query which is manual)
    useEffect(() => {
        if (!loading) { // Avoid double call on initial load
            loadBooks(searchQuery);
        }
    }, [selectedCategory]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [catsRes, booksRes] = await Promise.all([
                booksAPI.getCategories(),
                booksAPI.getBooks({ limit: 20 })
            ]);
            setCategories(catsRes.data);
            setBooks(booksRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBooks = async (query = '') => {
        setLoading(true);
        try {
            // Build params
            const params: any = { limit: 20 };
            if (selectedCategory) params.lccCode = selectedCategory;

            if (query) {
                const response = await booksAPI.search(query);
                // Client-side filter for search results
                let results = response.data;
                if (selectedCategory) results = results.filter((b: any) => b.lccCode === selectedCategory);
                setBooks(results);
            } else {
                const response = await booksAPI.getBooks(params);
                setBooks(response.data);
            }
        } catch (error) {
            console.error('Error loading books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadBooks(searchQuery);
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setSearchQuery('');
        loadBooks(''); // Reset all
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
                {/* Active Filters Summary */}
                {selectedCategory && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-brand-red uppercase">Active Filters</h4>
                            <button onClick={clearFilters} className="text-brand-red hover:text-red-800 p-1 hover:bg-red-100 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedCategory && <span className="text-xs bg-white text-gray-700 px-2 py-1 rounded border shadow-sm">{categories.find(c => c._id === selectedCategory)?.name || selectedCategory}</span>}
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex items-center gap-2 mb-4 text-gray-900">
                        <Filter className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Categories</h3>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-2">
                        <label className="flex items-center space-x-3 cursor-pointer group p-1 rounded hover:bg-gray-50">
                            <input
                                type="radio"
                                name="category"
                                checked={selectedCategory === null}
                                onChange={() => setSelectedCategory(null)}
                                className="h-4 w-4 text-brand-red border-gray-300 focus:ring-brand-red"
                            />
                            <span className="text-gray-600 group-hover:text-brand-blue transition-colors text-sm font-medium">All Categories</span>
                        </label>
                        {categories.map((cat) => (
                            <label key={cat._id} className="flex items-center space-x-3 cursor-pointer group p-1 rounded hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="category"
                                    checked={selectedCategory === cat._id}
                                    onChange={() => setSelectedCategory(cat._id)}
                                    className="h-4 w-4 text-brand-red border-gray-300 focus:ring-brand-red"
                                />
                                <span className="text-gray-600 group-hover:text-brand-blue transition-colors text-sm font-medium flex-1">
                                    {cat.name} <span className="text-xs text-gray-400 font-normal ml-1">({cat.count})</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-bold text-brand-blue mb-2 text-sm">Need Help?</h4>
                    <p className="text-xs text-gray-600 mb-3">Our librarians are available 24/7 to assist with your research.</p>
                    <button className="text-xs font-bold text-brand-red hover:underline">Contact Support</button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                {/* Search Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Collection</h1>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for books, authors, or ISBNs..."
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue shadow-sm bg-white text-gray-900 transition-all font-medium"
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        </div>
                        <button
                            type="submit"
                            className="bg-brand-blue hover:bg-brand-dark text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </button>
                    </form>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Showing <span className="font-bold text-brand-dark">{books.length}</span> results</p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Books Grid - Image Based & Compact */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {books.map((book: any) => (
                            <div key={book._id} className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-brand-blue/30 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
                                {/* Book Image - Fixed Height for consistency but shorter than aspect ratio */}
                                <div className="relative h-52 overflow-hidden bg-gray-100 group-hover:opacity-95 transition-opacity">
                                    <img
                                        src={`https://picsum.photos/seed/${book.isbn || book._id}/300/400`}
                                        alt={book.title}
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/300x400?text=No+Cover';
                                        }}
                                    />

                                    {/* Badges */}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-brand-dark shadow-sm border border-gray-100">
                                        {book.lccCode}
                                    </div>
                                    {book.status === 'borrowed' && (
                                        <div className="absolute top-2 left-2 bg-brand-red/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm">
                                            Out
                                        </div>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-[10px] text-brand-blue font-bold uppercase tracking-wide mb-1">
                                        <Tag className="w-3 h-3" />
                                        <span className="truncate">{book.lccName || 'General'}</span>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-brand-blue transition-colors min-h-[2.5em]">
                                        {book.title}
                                    </h3>

                                    <div className="flex items-center text-xs text-gray-500 mb-3">
                                        <User className="w-3 h-3 mr-1" />
                                        <span className="truncate max-w-[150px]">{book.authors[0]}</span>
                                    </div>

                                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 font-medium">{book.publishedYear}</span>
                                        <Link
                                            href={`/books/${book._id}`}
                                            className="text-xs font-bold text-brand-red hover:text-brand-dark hover:underline flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                        >
                                            View <BookOpen className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && books.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-lg border border-gray-200 border-dashed">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No books found</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">We couldn't find any books matching your filters. Try adjusting your search.</p>
                        <button onClick={clearFilters} className="mt-4 text-brand-blue font-bold text-sm hover:underline">Clear all filters</button>
                    </div>
                )}
            </div>
        </div>
    );
}
