'use client';

import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface AnalyticsData {
    stats: {
        totalSessions: number;
        activeUsers: number;
        avgAttendance: number;
    };
    charts: {
        attendanceHistory: { date: string; attendees: number }[];
        memberAttendance: { name: string; count: number }[];
        instrumentDistribution: { name: string; count: number }[];
    };
    meta?: {
        allTime: {
            start: string;
            end: string;
        }
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    // Default range: Current Year
    const [startDate, setStartDate] = useState(() => {
        const year = new Date().getFullYear();
        return `${year}-01-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const year = new Date().getFullYear();
        return `${year}-12-31`;
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams({ startDate, endDate });
                const res = await fetch(`/api/analytics?${query.toString()}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    const setRange = (range: 'last_month' | 'this_month' | 'last_6_months' | 'last_year' | 'all_time') => {
        const today = new Date();
        let start = new Date();
        let end = new Date(); // Default end is today

        let useCustom = false;

        switch (range) {
            case 'last_month':
                start.setMonth(today.getMonth() - 1);
                start.setDate(1);
                end.setDate(0); // Last day of previous month
                break;
            case 'this_month':
                start.setDate(1);
                // End date is today
                break;
            case 'last_6_months':
                start.setMonth(today.getMonth() - 6);
                break;
            case 'last_year':
                start.setFullYear(today.getFullYear() - 1);
                break;
            case 'all_time':
                if (data?.meta?.allTime) {
                    setStartDate(data.meta.allTime.start.split('T')[0]);
                    setEndDate(data.meta.allTime.end.split('T')[0]);
                    return;
                }
                // Fallback if no meta
                start.setFullYear(2020);
                break;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    // Initial loading state
    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) return <div className="text-text-secondary">Failed to load analytics data.</div>;

    return (
        <div className={`space-y-8 p-6 ${loading ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-200`}>
            <div className="flex flex-col xl:flex-row justify-end items-start xl:items-center gap-4">

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border text-sm">
                        <button onClick={() => setRange('last_month')} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">Last Month</button>
                        <div className="w-[1px] h-4 bg-border"></div>
                        <button onClick={() => setRange('this_month')} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">This Month</button>
                        <div className="w-[1px] h-4 bg-border"></div>
                        <button onClick={() => setRange('last_6_months')} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">Last 6M</button>
                        <div className="w-[1px] h-4 bg-border"></div>
                        <button onClick={() => setRange('last_year')} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">Last Year</button>
                        <div className="w-[1px] h-4 bg-border"></div>
                        <button onClick={() => setRange('all_time')} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">All Time</button>
                    </div>

                    <div className="flex items-center gap-2 bg-surface p-2 rounded-lg border border-border">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-background text-text-primary px-3 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        <span className="text-text-secondary">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-background text-text-primary px-3 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Total Sessions" value={data.stats.totalSessions} icon="📅" />
                <MetricCard title="Active Users" value={data.stats.activeUsers} icon="👥" />
                <MetricCard title="Avg. Attendance" value={data.stats.avgAttendance} icon="📊" />
            </div>

            {/* Attendance Chart */}
            <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-xl font-semibold mb-6 text-text-primary">Attendance History</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.charts.attendanceHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                stroke="#888"
                            />
                            <YAxis stroke="#888" allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#E5E7EB' }}
                                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            />
                            <Line type="monotone" dataKey="attendees" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instrument Distribution */}
                <div className="bg-surface rounded-xl p-6 border border-border">
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Instrument Distribution</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.charts.instrumentDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.charts.instrumentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Member Attendance */}
                <div className="bg-surface rounded-xl p-6 border border-border">
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Member Attendance</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.memberAttendance} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#888" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#888" fontSize={12} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon }: { title: string; value: number | string; icon: string }) {
    return (
        <div className="bg-surface p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-text-secondary text-sm font-medium uppercase tracking-wider">{title}</span>
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-4xl font-bold text-text-primary">{value}</div>
        </div>
    );
}
