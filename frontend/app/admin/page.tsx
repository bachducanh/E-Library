'use client';

import { useEffect, useState } from 'react';
import { booksAPI, usersAPI } from '@/lib/api';
import axios from 'axios';
import {
    Search, Plus, Edit, Trash2, X, Save,
    BookOpen, Users, LayoutDashboard, Settings,
    MoreHorizontal, Shield, Book
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const LCC_CATEGORIES: Record<string, string> = {
    'A': 'General Works',
    'B': 'Philosophy & Psychology',
    'D': 'History',
    'H': 'Social Sciences',
    'K': 'Law',
    'L': 'Education',
    'P': 'Language & Literature',
    'Q': 'Science',
    'T': 'Technology'
};

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'books' | 'users'>('books');
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

    // Users State
    const [users, setUsers] = useState<any[]>([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [userFormData, setUserFormData] = useState({
        fullName: '', phone: '', branchId: '', role: 'member'
    });

    useEffect(() => {
        if (activeTab === 'books') loadBooks();
        else loadUsers();
    }, [activeTab]);

    // --- BOOKS LOGIC ---
    const loadBooks = async () => {
        setLoading(true);
        try {
            const response = await booksAPI.getBooks({ limit: 100 });
            setBooks(response.data);
        } catch (error) { console.error('Error loading books:', error); }
        finally { setLoading(false); }
    };

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
            loadBooks();
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
            loadBooks();
        } catch (error) { alert('Failed to delete book'); }
    };

    // --- USERS LOGIC ---
    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.getUsers();
            setUsers(response.data);
        } catch (error) { console.error('Error loading users:', error); }
        finally { setLoading(false); }
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await usersAPI.updateUser(editingUser._id, userFormData);
                alert('User updated successfully!');
                setShowUserForm(false);
                setEditingUser(null);
                loadUsers();
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to update user');
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await usersAPI.deleteUser(id);
            loadUsers();
        } catch (error) { alert('Failed to delete user'); }
    };

    // --- FILTERING ---
    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn.includes(searchQuery)
    );

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutDashboard className="w-8 h-8 text-brand-blue" />
                    Admin Portal
                </h1>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('books')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'books' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2"><Book className="w-4 h-4" /> Book Management</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <span className="flex items-center gap-2"><Users className="w-4 h-4" /> User Management</span>
                    </button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={activeTab === 'books' ? "Search books by title, ISBN..." : "Search users by name, email..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                    />
                </div>
                <button
                    onClick={() => {
                        if (activeTab === 'books') {
                            setEditingBook(null);
                            setBookFormData({ title: '', authors: '', isbn: '', publisher: '', publishedYear: 2024, pages: 0, lccCode: 'Q', subjects: '', description: '' });
                            setShowBookForm(true);
                        } else {
                            alert("To create a user, please use the Registration page.");
                        }
                    }}
                    className={`bg-brand-blue hover:bg-brand-dark text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
                >
                    <Plus className="w-5 h-5" /> {activeTab === 'books' ? 'Add Book' : 'Add User'}
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                    </div>
                ) : (
                    activeTab === 'books' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Title</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredBooks.map((book) => (
                                        <tr key={book._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{book.title}</div>
                                                <div className="text-sm text-gray-500">{book.authors?.join(', ')} • {book.publishedYear}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${book.status === 'borrowed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {book.status || 'Available'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{book.lccCode} - {LCC_CATEGORIES[book.lccCode] || 'General'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingBook(book);
                                                            setBookFormData({
                                                                title: book.title, authors: book.authors.join(', '), isbn: book.isbn,
                                                                publisher: book.publisher, publishedYear: book.publishedYear, pages: book.pages,
                                                                lccCode: book.lccCode, subjects: book.subjects.join(', '), description: book.description
                                                            });
                                                            setShowBookForm(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBook(book._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Contact</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-xs">
                                                        {user.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{user.fullName}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setUserFormData({ fullName: user.fullName, phone: user.phone, branchId: user.branchId, role: user.role });
                                                            setShowUserForm(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
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
