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
        totalSongs?: number;
        totalRecordings?: number;
    };
    charts: {
        attendanceHistory: { date: string; attendees: number }[];
        memberAttendance: { name: string; count: number }[];
        instrumentDistribution: { name: string; count: number }[];
        songKeyDistribution?: { name: string; count: number }[];
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

    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const setRange = (range: 'last_month' | 'this_month' | 'next_month' | 'last_6_months' | 'last_year' | 'all_time') => {
        const today = new Date();
        let start = new Date(today);
        let end = new Date(today); // Default end is today

        switch (range) {
            case 'last_month':
                // Safe way to get previous month
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
                break;
            case 'next_month':
                start = new Date(today.getFullYear(), today.getMonth() + 1, 1); // 1st day of next month
                end = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Last day of next month
                break;
            case 'last_6_months':
                start = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
                break;
            case 'last_year':
                start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                break;
            case 'all_time':
                if (data?.meta?.allTime) {
                    setStartDate(data.meta.allTime.start.split('T')[0]);
                    setEndDate(data.meta.allTime.end.split('T')[0]);
                    return;
                }
                // Fallback if no meta
                start = new Date(2020, 0, 1);
                break;
        }

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
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
        <div className={`space-y-6 p-0 md:p-6 ${loading ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-200`}>
            <div className="flex flex-col xl:flex-row justify-end items-start xl:items-center gap-4">

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-wrap items-center justify-center gap-2 bg-surface p-1 rounded-lg border border-border text-xs md:text-sm w-full md:w-auto">
                        <button type="button" onClick={() => setRange('last_month')} className="px-2 md:px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors whitespace-nowrap">Last Month</button>
                        <div className="hidden md:block w-[1px] h-4 bg-border"></div>
                        <button type="button" onClick={() => setRange('this_month')} className="px-2 md:px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors whitespace-nowrap">This Month</button>
                        <div className="hidden md:block w-[1px] h-4 bg-border"></div>
                        <button type="button" onClick={() => setRange('next_month')} className="px-2 md:px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors whitespace-nowrap">Next Month</button>
                        <div className="hidden md:block w-[1px] h-4 bg-border"></div>
                        <button type="button" onClick={() => setRange('last_6_months')} className="px-2 md:px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors whitespace-nowrap">Last 6M</button>
                        <div className="hidden md:block w-[1px] h-4 bg-border"></div>
                        <button type="button" onClick={() => setRange('last_year')} className="px-2 md:px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors whitespace-nowrap">Last Year</button>
                        <div className="hidden md:block w-[1px] h-4 bg-border"></div>
                        <button type="button" onClick={() => setRange('all_time')} className="px-2 md:px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors whitespace-nowrap">All Time</button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 bg-surface p-2 rounded-lg border border-border w-full md:w-auto">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-background text-text-primary px-3 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm w-full sm:w-auto"
                        />
                        <span className="text-text-secondary hidden sm:inline">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-background text-text-primary px-3 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm w-full sm:w-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <MetricCard title="Total Sessions" value={data.stats.totalSessions} icon="📅" />
                <MetricCard title="Active Users" value={data.stats.activeUsers} icon="👥" />
                <MetricCard title="Avg. Attendance" value={data.stats.avgAttendance} icon="📊" />
                <MetricCard title="Total Songs" value={data.stats.totalSongs || 0} icon="🎵" />
                <MetricCard title="Recordings" value={data.stats.totalRecordings || 0} icon="🎙️" />
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
                            <Line type="monotone" dataKey="attendees" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} animationDuration={500} />
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
                                    label={({ name, percent }) => {
                                        if (!name || percent === undefined) return '';
                                        return `${name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${(percent * 100).toFixed(0)}%`;
                                    }}
                                    animationDuration={500}
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
                                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} animationDuration={500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Song Keys & Top Contributors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Distribution */}
                <div className="bg-surface rounded-xl p-6 border border-border">
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Popular Song Keys</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.charts.songKeyDistribution || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} animationDuration={500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Contributors Leaderboard */}
                <div className="bg-surface rounded-xl p-6 border border-border">
                    <h3 className="text-xl font-semibold mb-6 text-text-primary">Top Contributors 🏆</h3>
                    <div className="space-y-4">
                        {data.charts.memberAttendance.slice(0, 3).map((member, index) => {
                            let rankColor = "bg-surface-secondary border-border";
                            let icon = "👏";

                            if (index === 0) { rankColor = "bg-yellow-500/10 border-yellow-500/50"; icon = "🥇"; }
                            if (index === 1) { rankColor = "bg-gray-400/10 border-gray-400/50"; icon = "🥈"; }
                            if (index === 2) { rankColor = "bg-orange-700/10 border-orange-700/50"; icon = "🥉"; }

                            return (
                                <div key={index} className={`flex items-center justify-between p-4 rounded-lg border ${rankColor}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{icon}</div>
                                        <div>
                                            <div className="font-bold text-text-primary text-lg">{member.name}</div>
                                            <div className="text-xs text-text-secondary">Consistent Attendee</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-primary">{member.count} <span className="text-sm font-normal text-text-secondary">Sessions</span></div>
                                </div>
                            );
                        })}
                        {data.charts.memberAttendance.length === 0 && (
                            <div className="text-center text-text-secondary py-8">No attendance data yet.</div>
                        )}
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
