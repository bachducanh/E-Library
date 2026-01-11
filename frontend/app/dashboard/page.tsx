'use client';

import { useEffect, useState } from 'react';
import { statsAPI } from '@/lib/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [categoryData, setCategoryData] = useState<any>(null);
    const [branchData, setBranchData] = useState<any>(null);
    const [trendsData, setTrendsData] = useState<any>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load all dashboard data
            const [dashboard, categories, branches, trends] = await Promise.all([
                statsAPI.getDashboard(),
                statsAPI.getBooksByCategory(),
                statsAPI.getLoansByBranch(),
                statsAPI.getTransactionTrends(30),
            ]);

            setDashboardData(dashboard.data);
            setCategoryData(categories.data);
            setBranchData(branches.data);
            setTrendsData(trends.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const categoryChartData = {
        labels: categoryData?.map((c: any) => c._id) || [],
        datasets: [
            {
                label: 'Number of Books',
                data: categoryData?.map((c: any) => c.count) || [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)',
                    'rgba(83, 102, 255, 0.8)',
                    'rgba(255, 99, 255, 0.8)',
                    'rgba(99, 255, 132, 0.8)',
                ],
                borderWidth: 2,
                borderColor: '#fff',
            },
        ],
    };

    const branchChartData = {
        labels: branchData?.map((b: any) => b._id) || [],
        datasets: [
            {
                label: 'Total Loans',
                data: branchData?.map((b: any) => b.totalLoans) || [],
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
            },
            {
                label: 'Active Loans',
                data: branchData?.map((b: any) => b.activeLoans) || [],
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
            },
        ],
    };

    // Process trends data for line chart
    const processTrendsData = () => {
        if (!trendsData) return { labels: [], datasets: [] };

        const dates = [...new Set(trendsData.map((t: any) => t._id.date))].sort();
        const borrowData = dates.map(date => {
            const item = trendsData.find((t: any) => t._id.date === date && t._id.type === 'borrow');
            return item ? item.count : 0;
        });
        const returnData = dates.map(date => {
            const item = trendsData.find((t: any) => t._id.date === date && t._id.type === 'return');
            return item ? item.count : 0;
        });

        return {
            labels: dates,
            datasets: [
                {
                    label: 'Borrows',
                    data: borrowData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Returns',
                    data: returnData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.4,
                    fill: true,
                },
            ],
        };
    };

    const trendsChartData = processTrendsData();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#fff',
                    font: {
                        size: 12,
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
            },
            y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
            },
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#fff',
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard
                </h1>
                <button
                    onClick={loadDashboardData}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                >
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="glass-dark p-4 rounded-lg">
                    <div className="text-sm text-white/60">Total Books</div>
                    <div className="text-2xl font-bold text-white mt-1">{dashboardData?.totalBooks || 0}</div>
                </div>
                <div className="glass-dark p-4 rounded-lg">
                    <div className="text-sm text-white/60">Total Copies</div>
                    <div className="text-2xl font-bold text-white mt-1">{dashboardData?.totalCopies || 0}</div>
                </div>
                <div className="glass-dark p-4 rounded-lg">
                    <div className="text-sm text-white/60">Members</div>
                    <div className="text-2xl font-bold text-white mt-1">{dashboardData?.totalMembers || 0}</div>
                </div>
                <div className="glass-dark p-4 rounded-lg">
                    <div className="text-sm text-white/60">Total Loans</div>
                    <div className="text-2xl font-bold text-white mt-1">{dashboardData?.totalLoans || 0}</div>
                </div>
                <div className="glass-dark p-4 rounded-lg">
                    <div className="text-sm text-white/60">Active Loans</div>
                    <div className="text-2xl font-bold text-green-400 mt-1">{dashboardData?.activeLoans || 0}</div>
                </div>
                <div className="glass-dark p-4 rounded-lg">
                    <div className="text-sm text-white/60">Available</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">{dashboardData?.availableCopies || 0}</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Books by Category - Pie Chart */}
                <div className="glass-dark p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Books by Category</h2>
                    <div className="h-80">
                        <Pie data={categoryChartData} options={pieOptions} />
                    </div>
                </div>

                {/* Loans by Branch - Bar Chart */}
                <div className="glass-dark p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Loans by Branch</h2>
                    <div className="h-80">
                        <Bar data={branchChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Transaction Trends - Line Chart */}
                <div className="glass-dark p-6 rounded-xl md:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-4">Transaction Trends (Last 30 Days)</h2>
                    <div className="h-80">
                        <Line data={trendsChartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
