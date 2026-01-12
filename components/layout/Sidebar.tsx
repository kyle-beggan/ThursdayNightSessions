'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface NavItem {
    name: string;
    href: string;
    icon: string;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Song Library', href: '/songs', icon: '🎵' },
    { name: 'Recordings', href: '/recordings', icon: '🎙️' },
    { name: 'Chat', href: '/chat', icon: '💬' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
    { name: 'Feedback', href: '/feedback', icon: '💡' },
    { name: 'Admin', href: '/admin', icon: '⚙️', adminOnly: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { data: session } = useSession();
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Initial responsive state
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        // Set initial state
        handleResize();

        // Optional: Listen for resize if we want it to auto-collapse/expand
        // window.addEventListener('resize', handleResize);
        // return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch unread chat count on mount
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!session?.user) return;
            try {
                const res = await fetch('/api/chat/unread');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadChatCount(data.count);
                }
            } catch (error) {
                console.error('Failed to fetch unread chat count:', error);
            }
        };

        fetchUnreadCount();
    }, [session]);

    return (
        <aside
            className={`sticky left-0 top-[73px] h-[calc(100vh-73px)] bg-surface/50 backdrop-blur-lg border-r border-border transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-4 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center hover:bg-surface-hover transition-colors z-10"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <span className="text-xs text-text-primary">
                    {isCollapsed ? '→' : '←'}
                </span>
            </button>

            {/* Navigation Items */}
            <nav className={`space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                    // Skip admin items if user is not admin
                    if (item.adminOnly && session?.user?.userType !== 'admin') {
                        return null;
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group ${isActive
                                ? 'bg-primary/20 text-primary border border-primary/50'
                                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <span className="text-xl flex-shrink-0 relative flex items-center justify-center">
                                {item.icon}
                                {/* Collapsed State Badge */}
                                {isCollapsed && item.name === 'Chat' && unreadChatCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white border-2 border-surface animate-bounce-in">
                                        {/* Dot only for collapsed to save space, or mini number */}
                                    </span>
                                )}
                            </span>
                            {!isCollapsed && (
                                <span className="font-medium text-sm flex-1 flex items-center justify-between">
                                    {item.name}
                                    {/* Expanded State Badge */}
                                    {item.name === 'Chat' && unreadChatCount > 0 && (
                                        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white animate-bounce-in">
                                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                                        </span>
                                    )}
                                </span>
                            )}
                            {!isCollapsed && item.adminOnly && (
                                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    Admin
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
