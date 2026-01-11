'use client';

import { useEffect, useState } from 'react';
import { booksAPI } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function BookDetailPage() {
    const params = useParams();
    const [book, setBook] = useState<any>(null);
    const [copies, setCopies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadBookDetails(params.id as string);
        }
    }, [params.id]);

    const loadBookDetails = async (bookId: string) => {
        try {
            setLoading(true);
            const [bookRes, copiesRes] = await Promise.all([
                booksAPI.getBook(bookId),
                booksAPI.getCopies(bookId)
            ]);
            setBook(bookRes.data);
            setCopies(copiesRes.data);
        } catch (error) {
            console.error('Error loading book:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="text-center py-12">
                <p className="text-xl text-gray-600 dark:text-gray-300">Book not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Book Header */}
            <div className="glass-dark p-8 rounded-xl">
                <div className="flex items-start gap-6">
                    <div className="w-32 h-48 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-4xl">
                        📚
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">{book.title}</h1>
                        <p className="text-white/80 mb-4">by {book.authors?.join(', ')}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-white/60">Publisher</p>
                                <p className="text-white font-semibold">{book.publisher}</p>
                            </div>
                            <div>
                                <p className="text-white/60">Year</p>
                                <p className="text-white font-semibold">{book.publishedYear}</p>
                            </div>
                            <div>
                                <p className="text-white/60">Pages</p>
                                <p className="text-white font-semibold">{book.pages}</p>
                            </div>
                            <div>
                                <p className="text-white/60">ISBN</p>
                                <p className="text-white font-semibold text-xs">{book.isbn}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Book Details */}
            <div className="glass p-6 rounded-xl">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Details</h2>

                <div className="space-y-4">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Category</p>
                        <p className="text-gray-800 dark:text-white font-semibold">
                            {book.lccName} ({book.lccCode})
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Subjects</p>
                        <div className="flex flex-wrap gap-2">
                            {book.subjects?.map((subject: string) => (
                                <span
                                    key={subject}
                                    className="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm"
                                >
                                    {subject}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Description</p>
                        <p className="text-gray-700 dark:text-gray-300">{book.description}</p>
                    </div>
                </div>
            </div>

            {/* Available Copies */}
            <div className="glass p-6 rounded-xl">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    Available Copies ({copies.filter(c => c.status === 'available').length}/{copies.length})
                </h2>

                {copies.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No physical copies available</p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {copies.map((copy: any) => (
                            <div
                                key={copy._id}
                                className={`p-4 rounded-lg border-2 ${copy.status === 'available'
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                        {copy.barcode}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${copy.status === 'available'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                            }`}
                                    >
                                        {copy.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Branch:</span> {copy.branchId}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Condition:</span> {copy.condition}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Back Button */}
            <div>
                <a
                    href="/books"
                    className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                    ← Back to Search
                </a>
            </div>
        </div>
    );
}
