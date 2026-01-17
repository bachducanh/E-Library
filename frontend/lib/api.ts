/**
 * API client for frontend
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    register: (data: any) =>
        api.post('/auth/register', data),

    getMe: () =>
        api.get('/auth/me'),
};

// Books API
export const booksAPI = {
    search: (query: string, limit = 50) =>
        api.get('/books/search', { params: { q: query, limit } }),

    getBooks: (params: any) =>
        api.get('/books/', { params }),

    getBook: (id: string) =>
        api.get(`/books/${id}`),

    getCopies: (bookId: string, params?: any) =>
        api.get(`/books/${bookId}/copies`, { params }),

    getDigitalLicense: (bookId: string) =>
        api.get(`/books/${bookId}/digital`),

    getCategories: () =>
        api.get('/books/categories/list'),
};

// Loans API
export const loansAPI = {
    borrow: (copyId: string, memberId: string) =>
        api.post('/loans/borrow', { copyId, memberId }),

    returnBook: (loanId: string) =>
        api.post(`/loans/return/${loanId}`),

    renewLoan: (loanId: string) =>
        api.post(`/loans/renew/${loanId}`),

    getMyLoans: (status?: string) =>
        api.get('/loans/my-loans', { params: { status } }),

    getLoans: (params?: any) =>
        api.get('/loans/', { params }),
};

// Transactions API
export const transactionsAPI = {
    getTransactions: (params?: any) =>
        api.get('/transactions/', { params }),
};

// Stats API
export const statsAPI = {
    getDashboard: () =>
        api.get('/stats/dashboard'),

    getBooksByCategory: () =>
        api.get('/stats/books-by-category'),

    getLoansByBranch: () =>
        api.get('/stats/loans-by-branch'),

    getTransactionTrends: (days = 30) =>
        api.get('/stats/transaction-trends', { params: { days } }),

    getTopBorrowedBooks: (limit = 10) =>
        api.get('/stats/top-borrowed-books', { params: { limit } }),

    getMemberActivity: () =>
        api.get('/stats/member-activity'),

    getBranchPerformance: () =>
        api.get('/stats/branch-performance'),
};

// Users API (Admin)
export const usersAPI = {
    getUsers: (params?: any) =>
        api.get('/users/', { params }),

    createUser: (data: any) =>
        api.post('/users/', data),

    updateUser: (id: string, data: any) =>
        api.put(`/users/${id}`, data),

    deleteUser: (id: string) =>
        api.delete(`/users/${id}`),
};

export default api;
