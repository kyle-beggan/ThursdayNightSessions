'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
    { name: 'Analytics', href: '/analytics', icon: '📊' },
    { name: 'Admin', href: '/admin', icon: '⚙️', adminOnly: true },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { data: session } = useSession();

    return (
        <aside
            className={`sticky left-0 top-[73px] h-[calc(100vh-73px)] bg-surface/50 backdrop-blur-lg border-r border-border transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-4 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center hover:bg-surface-hover transition-colors"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <span className="text-xs text-text-primary">
                    {isCollapsed ? '→' : '←'}
                </span>
            </button>

            {/* Navigation Items */}
            <nav className="p-4 space-y-2">
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
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary/20 text-primary border border-primary/50'
                                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                }`}
                            title={isCollapsed ? item.name : undefined}
                        >
                            <span className="text-xl flex-shrink-0">{item.icon}</span>
                            {!isCollapsed && (
                                <span className="font-medium text-sm">{item.name}</span>
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
