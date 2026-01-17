'use client';

import { useEffect, useState } from 'react';
import { booksAPI, usersAPI, loansAPI, transactionsAPI } from '@/lib/api';
import axios from 'axios';
import {
    Search, Plus, Edit, Trash2, X, Save,
    BookOpen, Users, LayoutDashboard, Settings,
    MoreHorizontal, Shield, Book, History, FileText, Server
} from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const LCC_CATEGORIES: Record<string, string> = {
    'A': 'General Works',
    'B': 'Philosophy & Psychology',
    'D': 'History',
    'HP': 'Social Sciences',
    'K': 'Law',
    'L': 'Education',
    'P': 'Language & Literature',
    'Q': 'Science',
    'T': 'Technology'
};

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'books' | 'users' | 'loans' | 'transactions'>('books');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Books State
    const [books, setBooks] = useState<any[]>([]);
    const [showBookForm, setShowBookForm] = useState(false);
    const [editingBook, setEditingBook] = useState<any>(null);
    const [bookFormData, setBookFormData] = useState({
        title: '', authors: '', isbn: '', publisher: '',
        publishedYear: new Date().getFullYear(), pages: 0,
        lccCode: 'Q', subjects: '', description: ''
    });

    // Copies State
    const [showCopiesModal, setShowCopiesModal] = useState(false);
    const [selectedBookForCopies, setSelectedBookForCopies] = useState<any>(null);
    const [bookCopies, setBookCopies] = useState<any[]>([]);
    const [newCopyData, setNewCopyData] = useState({ branchId: 'HN', condition: 'Good' });

    // Copies Handlers
    const openCopiesModal = async (book: any) => {
        setSelectedBookForCopies(book);
        setShowCopiesModal(true);
        try {
            const res = await booksAPI.getCopies(book._id);
            setBookCopies(res.data);
        } catch (e) { console.error("Error fetching copies", e); }
    };

    const handleAddCopy = async () => {
        if (!selectedBookForCopies) return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/books/${selectedBookForCopies._id}/copies`, newCopyData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh copies
            const res = await booksAPI.getCopies(selectedBookForCopies._id);
            setBookCopies(res.data);
            alert("Copy added successfully");
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to add copy");
        }
    };

    // Users State
    const [users, setUsers] = useState<any[]>([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [userFormData, setUserFormData] = useState({
        fullName: '', phone: '', branchId: '', role: 'member'
    });

    // Loans State
    const [loans, setLoans] = useState<any[]>([]);

    // Transactions State
    const [transactions, setTransactions] = useState<any[]>([]);

    const [error, setError] = useState<string | null>(null);

    // --- SEARCH & DATA LOADING ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setError(null);
            if (activeTab === 'books') loadBooks(searchQuery);
            else if (activeTab === 'users') loadUsers(searchQuery);
            else if (activeTab === 'loans') loadLoans();
            else if (activeTab === 'transactions') loadTransactions();
        }, 300); // Debounce

        return () => clearTimeout(timer);
    }, [activeTab, searchQuery]);

    // --- BOOKS LOGIC ---
    const loadBooks = async (query = '') => {
        setLoading(true);
        try {
            let response;
            if (query) {
                response = await booksAPI.search(query, 100);
            } else {
                response = await booksAPI.getBooks({ limit: 100 });
            }
            setBooks(response.data);
        } catch (error) {
            console.error('Error loading books:', error);
            // Books usually public, so maybe just log
        }
        finally { setLoading(false); }
    };

    // ... (rest of loads)

    // --- USERS LOGIC ---
    const loadUsers = async (query = '') => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (query) params.q = query;
            const response = await usersAPI.getUsers(params);
            setUsers(response.data);
        } catch (error: any) {
            console.error('Error loading users:', error);
            setError("Failed to load users. You may not have permission.");
        }
        finally { setLoading(false); }
    };

    // --- LOANS LOGIC ---
    const loadLoans = async () => {
        setLoading(true);
        try {
            const response = await loansAPI.getLoans({ limit: 100 });
            let data = response.data;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                data = data.filter((l: any) => l._id.toLowerCase().includes(q) || l.memberId.toLowerCase().includes(q));
            }
            setLoans(data);
        } catch (error: any) {
            console.error('Error loading loans:', error);
            setError("Failed to load loans. Ensure you are an Admin.");
        }
        finally { setLoading(false); }
    };

    // --- TRANSACTIONS LOGIC ---
    const loadTransactions = async () => {
        setLoading(true);
        try {
            const response = await transactionsAPI.getTransactions({ limit: 100 });
            let data = response.data;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                data = data.filter((t: any) => t._id.toLowerCase().includes(q) || t.memberId.toLowerCase().includes(q) || t.type.toLowerCase().includes(q));
            }
            setTransactions(data);
        } catch (error: any) {
            console.error('Error loading transactions:', error);
            setError("Failed to load transactions. Ensure you are an Admin.");
        }
        finally { setLoading(false); }
    };

    // Helper to switch data source for render
    const getData = () => {
        if (activeTab === 'books') return books;
        if (activeTab === 'users') return users;
        if (activeTab === 'loans') return loans;
        return transactions;
    };

    const currentData = getData();

    // --- HANDLERS (Restored) ---
    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const bookData = {
            ...bookFormData,
            authors: bookFormData.authors.split(',').map(a => a.trim()),
            subjects: bookFormData.subjects.split(',').map(s => s.trim()),
            publishedYear: parseInt(bookFormData.publishedYear.toString()),
            pages: parseInt(bookFormData.pages.toString()),
            lccName: LCC_CATEGORIES[bookFormData.lccCode] || 'General'
        };

        try {
            const token = localStorage.getItem('access_token');
            if (editingBook) {
                await axios.put(`${API_BASE_URL}/books/${editingBook._id}`, bookData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Book updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/books/`, bookData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Book created successfully!');
            }
            setShowBookForm(false);
            setEditingBook(null);
            loadBooks(searchQuery);
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to save book');
        }
    };

    const deleteBook = async (id: string) => {
        if (!confirm('Delete this book?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_BASE_URL}/books/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadBooks(searchQuery);
        } catch (error) { alert('Failed to delete book'); }
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await usersAPI.updateUser(editingUser._id, userFormData);
                alert('User updated successfully!');
                setShowUserForm(false);
                setEditingUser(null);
                loadUsers(searchQuery);
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to update user');
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await usersAPI.deleteUser(id);
            loadUsers(searchQuery);
        } catch (error) { alert('Failed to delete user'); }
    };

    const handleReturnBook = async (loanId: string) => {
        if (!confirm('Confirm return for this book?')) return;
        try {
            await loansAPI.returnBook(loanId);
            loadLoans(); // Refresh loans
            if (activeTab === 'transactions') loadTransactions();
            alert('Book returned successfully!');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to return book');
        }
    };

    const handleRenewLoan = async (loanId: string) => {
        if (!confirm('Renew this loan? This will extend the due date by 14 days.')) return;
        try {
            await loansAPI.renewLoan(loanId);
            loadLoans(); // Refresh loans
            if (activeTab === 'transactions') loadTransactions();
            alert('Loan renewed successfully! Due date extended by 14 days.');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to renew loan');
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
                    <Shield className="w-5 h-5" />
                    {error}
                </div>
            )}
            {/* Header with System Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <LayoutDashboard className="w-8 h-8 text-brand-blue" />
                        Admin Portal
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 w-fit">
                        <Server className="w-3 h-3" />
                        System Status: Multi-Node Active (HN - HP - DN) • Sync On
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {[
                        { id: 'books', label: 'Books', icon: Book },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'loans', label: 'Active Loans', icon: FileText },
                        { id: 'transactions', label: 'History', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-2"><tab.icon className="w-4 h-4" /> {tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    />
                </div>
                {activeTab === 'books' && (
                    <button
                        onClick={() => {
                            setEditingBook(null);
                            setBookFormData({ title: '', authors: '', isbn: '', publisher: '', publishedYear: new Date().getFullYear(), pages: 0, lccCode: 'Q', subjects: '', description: '' });
                            setShowBookForm(true);
                        }}
                        className="bg-brand-blue hover:bg-brand-dark text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add Book
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {activeTab === 'books' && (
                                        <>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Title</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                        </>
                                    )}
                                    {activeTab === 'users' && (
                                        <>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Contact</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                        </>
                                    )}
                                    {activeTab === 'loans' && (
                                        <>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Loan ID</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Member ID</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Book</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Borrowed</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Due / Returned</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Renewals</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                        </>
                                    )}
                                    {activeTab === 'transactions' && (
                                        <>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Tx ID</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Branch</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Member</th>
                                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentData.map((item: any) => (
                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                        {activeTab === 'books' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{item.title}</div>
                                                    <div className="text-sm text-gray-500">{item.authors?.join(', ')} • {item.publishedYear}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'borrowed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {item.status || 'Available'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{item.lccCode} - {LCC_CATEGORIES[item.lccCode] || 'General'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openCopiesModal(item)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Manage Copies"><BookOpen className="w-4 h-4" /></button>
                                                        <button onClick={() => {
                                                            setEditingBook(item);
                                                            setBookFormData({
                                                                title: item.title, authors: item.authors.join(', '), isbn: item.isbn,
                                                                publisher: item.publisher, publishedYear: item.publishedYear, pages: item.pages,
                                                                lccCode: item.lccCode, subjects: item.subjects.join(', '), description: item.description
                                                            });
                                                            setShowBookForm(true);
                                                        }} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteBook(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {activeTab === 'users' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-xs">
                                                            {item.fullName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{item.fullName}</div>
                                                            <div className="text-sm text-gray-500">{item.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{item.phone}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {item.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => {
                                                            setEditingUser(item);
                                                            setUserFormData({ fullName: item.fullName, phone: item.phone, branchId: item.branchId, role: item.role });
                                                            setShowUserForm(true);
                                                        }} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"><Settings className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteUser(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {activeTab === 'loans' && (
                                            <>
                                                <td className="px-6 py-4 font-mono text-xs text-brand-blue font-bold">{item._id}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{item.memberId}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.bookId}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{format(new Date(item.borrowedAt), 'MMM dd, yyyy')}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    {item.status === 'returned' && item.returnedAt ? (
                                                        <div>
                                                            <div className="text-green-700 font-semibold">{format(new Date(item.returnedAt), 'MMM dd, yyyy')}</div>
                                                            <div className="text-xs text-gray-500">Returned</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-600">{format(new Date(item.dueAt), 'MMM dd, yyyy')}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${(item.renewCount || 0) >= 2 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {item.renewCount || 0}/2
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-800' : item.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {item.status !== 'returned' && (item.renewCount || 0) < 2 && (
                                                            <button
                                                                onClick={() => handleRenewLoan(item._id)}
                                                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                                                title="Extend due date by 14 days"
                                                            >
                                                                Renew
                                                            </button>
                                                        )}
                                                        {item.status !== 'returned' && (
                                                            <button
                                                                onClick={() => handleReturnBook(item._id)}
                                                                className="text-xs bg-brand-blue text-white px-3 py-1 rounded hover:bg-brand-dark transition-colors"
                                                            >
                                                                Return
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {activeTab === 'transactions' && (
                                            <>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{item._id}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`uppercase text-xs font-bold px-2 py-1 rounded ${item.type === 'borrow' ? 'bg-blue-100 text-blue-800' : item.type === 'return' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{item.branchId}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{item.memberId}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{format(new Date(item.createdAt), 'MMM dd, HH:mm')}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* BOOK FORM MODAL */}
            {showBookForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">{editingBook ? 'Edit Book' : 'New Book'}</h2>
                            <button onClick={() => setShowBookForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleBookSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-2 rounded" placeholder="Title" value={bookFormData.title} onChange={e => setBookFormData({ ...bookFormData, title: e.target.value })} required />
                                <input className="border p-2 rounded" placeholder="ISBN" value={bookFormData.isbn} onChange={e => setBookFormData({ ...bookFormData, isbn: e.target.value })} required />
                            </div>
                            <input className="w-full border p-2 rounded" placeholder="Authors (comma separated)" value={bookFormData.authors} onChange={e => setBookFormData({ ...bookFormData, authors: e.target.value })} required />
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-2 rounded" placeholder="Publisher" value={bookFormData.publisher} onChange={e => setBookFormData({ ...bookFormData, publisher: e.target.value })} required />
                                <input type="number" className="border p-2 rounded" placeholder="Year" value={bookFormData.publishedYear} onChange={e => setBookFormData({ ...bookFormData, publishedYear: parseInt(e.target.value) })} required />
                            </div>
                            <select className="w-full border p-2 rounded" value={bookFormData.lccCode} onChange={e => setBookFormData({ ...bookFormData, lccCode: e.target.value })}>
                                {Object.entries(LCC_CATEGORIES).map(([Key, Val]) => <option key={Key} value={Key}>{Key} - {Val}</option>)}
                            </select>
                            <textarea className="w-full border p-2 rounded" rows={3} placeholder="Description" value={bookFormData.description} onChange={e => setBookFormData({ ...bookFormData, description: e.target.value })} />

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowBookForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-dark">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* COPIES MANAGEMENT MODAL */}
            {showCopiesModal && selectedBookForCopies && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Manage Copies</h2>
                                <p className="text-sm text-gray-500">for {selectedBookForCopies.title}</p>
                            </div>
                            <button onClick={() => setShowCopiesModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6">
                            {/* Add Copy Form */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Add New Copy</h3>
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Branch</label>
                                        <select
                                            className="w-full border p-2 rounded text-sm"
                                            value={newCopyData.branchId}
                                            onChange={e => setNewCopyData({ ...newCopyData, branchId: e.target.value })}
                                        >
                                            <option value="HN">Hanoi (HN)</option>
                                            <option value="HP">Haiphong (HP)</option>
                                            <option value="DN">Danang (DN)</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Condition</label>
                                        <select
                                            className="w-full border p-2 rounded text-sm"
                                            value={newCopyData.condition}
                                            onChange={e => setNewCopyData({ ...newCopyData, condition: e.target.value })}
                                        >
                                            <option value="New">New</option>
                                            <option value="Good">Good</option>
                                            <option value="Fair">Fair</option>
                                            <option value="Poor">Poor</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAddCopy}
                                        className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-dark transition-colors"
                                    >
                                        Add Copy
                                    </button>
                                </div>
                            </div>

                            {/* Copies List */}
                            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase">Existing Copies ({bookCopies.length})</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 border-b">Barcode</th>
                                            <th className="p-3 border-b">Branch</th>
                                            <th className="p-3 border-b">Condition</th>
                                            <th className="p-3 border-b">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {bookCopies.map((copy: any) => (
                                            <tr key={copy._id}>
                                                <td className="p-3 font-mono text-gray-600">{copy.barcode}</td>
                                                <td className="p-3 font-bold">{copy.branchId}</td>
                                                <td className="p-3">{copy.condition}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${copy.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {copy.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {bookCopies.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-6 text-center text-gray-500">No copies found. Add one above.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* USER FORM MODAL */}
            {showUserForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                            <button onClick={() => setShowUserForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input className="w-full border p-2 rounded" value={userFormData.fullName} onChange={e => setUserFormData({ ...userFormData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input className="w-full border p-2 rounded" value={userFormData.phone} onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select className="w-full border p-2 rounded" value={userFormData.role} onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}>
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-dark">Update User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
