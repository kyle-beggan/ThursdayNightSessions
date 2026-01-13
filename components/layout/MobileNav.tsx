'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    { name: 'Walkthrough', href: '/walkthrough', icon: '📘' },
    { name: 'Admin', href: '/admin', icon: '⚙️', adminOnly: true },
];

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <nav className="md:hidden sticky top-[73px] z-40 bg-surface/95 backdrop-blur-md border-b border-border overflow-x-auto no-scrollbar">
            <div className="flex items-center px-4 h-14 min-w-max gap-2">
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
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                    ? 'bg-primary/20 text-primary border border-primary/50'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                                }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
